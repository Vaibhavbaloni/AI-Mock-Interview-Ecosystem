import mongoose from 'mongoose';

const mongoMockStore: Record<string, any[]> = {};

function getMockCollection(modelName: string): any[] {
  if (!mongoMockStore[modelName]) {
    mongoMockStore[modelName] = [];
  }
  return mongoMockStore[modelName];
}

export function createMockMongooseDocument(data: any, modelName: string): any {
  const doc = {
    ...data,
    save: async function() {
      const collection = getMockCollection(modelName);
      const idx = collection.findIndex(x => x._id === doc._id);
      if (idx === -1) {
        collection.push(doc);
      } else {
        collection[idx] = doc;
      }
      return doc;
    },
    toObject: function() {
      const { save, toObject, toJSON, ...rest } = doc;
      return rest;
    },
    toJSON: function() {
      const { save, toObject, toJSON, ...rest } = doc;
      return rest;
    }
  };

  if (!doc._id) {
    doc._id = Math.random().toString(36).substring(2, 9);
  }

  if (!doc.createdAt) {
    doc.createdAt = new Date();
  }

  if (!doc.updatedAt) {
    doc.updatedAt = new Date();
  }

  Object.defineProperty(doc, 'id', {
    get() {
      return this._id;
    },
    set(val) {
      this._id = val;
    },
    configurable: true,
    enumerable: true
  });

  return doc;
}

export function createMongooseModelProxy<T extends mongoose.Model<any>>(
  actualModel: T,
  modelName: string
): T {
  return new Proxy(actualModel, {
    get(target, prop, receiver) {
      const collection = getMockCollection(modelName);

      const mockFindOne = async (query: any) => {
        const conditions = query?.where || query || {};
        const found = collection.find(item => {
          for (const key of Object.keys(conditions)) {
            if (item[key] !== conditions[key]) {
              return false;
            }
          }
          return true;
        });
        if (!found) return null;
        return createMockMongooseDocument({ ...found }, modelName);
      };

      const mockCreate = async (data: any) => {
        const newDocData = {
          _id: Math.random().toString(36).substring(2, 9),
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        collection.push(newDocData);
        return createMockMongooseDocument(newDocData, modelName);
      };

      const mockFind = async (query: any) => {
        const conditions = query?.where || query || {};
        const found = collection.filter(item => {
          for (const key of Object.keys(conditions)) {
            if (item[key] !== conditions[key]) {
              return false;
            }
          }
          return true;
        });
        return found.map(item => createMockMongooseDocument({ ...item }, modelName));
      };

      const mockUpdateOne = async (query: any, update: any) => {
        const conditions = query?.where || query || {};
        const item = collection.find(x => {
          for (const key of Object.keys(conditions)) {
            if (x[key] !== conditions[key]) return false;
          }
          return true;
        });
        if (item) {
          const dataToSet = update.$set || update;
          Object.assign(item, dataToSet);
          item.updatedAt = new Date();
        }
        return { nModified: item ? 1 : 0 };
      };

      const getMockMethod = (methodProp: string | symbol) => {
        if (methodProp === 'findOne') return mockFindOne;
        if (methodProp === 'create') return mockCreate;
        if (methodProp === 'find') return mockFind;
        if (methodProp === 'updateOne') return mockUpdateOne;
        return null;
      };

      // If mongoose is connected (readyState === 1), use actual mongoose but wrap with fallback!
      if (mongoose.connection.readyState === 1) {
        const originalValue = Reflect.get(target, prop, receiver);
        if (typeof originalValue === 'function') {
          return async (...args: any[]) => {
            try {
              return await originalValue.apply(target, args);
            } catch (err: any) {
              const isConnectionError = 
                err.message?.includes('buffering timed out') ||
                err.message?.includes('connection') ||
                err.message?.includes('topology') ||
                err.message?.includes('timeout') ||
                err.name === 'MongooseError' ||
                err.name === 'MongoNetworkError';

              if (isConnectionError) {
                console.warn(`⚠️ MongoDB connection error during ${String(prop)}. Falling back to Mock DB.`);
                mongoose.disconnect().catch(() => {});
                
                const mockMethod = getMockMethod(prop);
                if (mockMethod) {
                  return await mockMethod(...args);
                }
                
                console.error(`Mock Mongoose fallback error calling ${String(prop)}:`, err);
                return null;
              }
              throw err;
            }
          };
        }
        return originalValue;
      }

      // If not connected, use the mock methods
      const mockMethod = getMockMethod(prop);
      if (mockMethod) return mockMethod;

      // Default fallback
      const originalValue = Reflect.get(target, prop, receiver);
      if (typeof originalValue === 'function') {
        return async (...args: any[]) => {
          try {
            return await originalValue.apply(target, args);
          } catch (err) {
            console.error(`Mock Mongoose fallback error calling ${String(prop)}:`, err);
            return null;
          }
        };
      }

      return originalValue;
    }
  }) as unknown as T;
}
