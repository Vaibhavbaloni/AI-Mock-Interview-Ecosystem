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
      // If mongoose is connected (readyState === 1), use actual mongoose
      if (mongoose.connection.readyState === 1) {
        return Reflect.get(target, prop, receiver);
      }

      const collection = getMockCollection(modelName);

      if (prop === 'findOne') {
        return async (query: any) => {
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
      }

      if (prop === 'create') {
        return async (data: any) => {
          const newDocData = {
            _id: Math.random().toString(36).substring(2, 9),
            createdAt: new Date(),
            updatedAt: new Date(),
            ...data,
          };
          collection.push(newDocData);
          return createMockMongooseDocument(newDocData, modelName);
        };
      }

      if (prop === 'find') {
        return async (query: any) => {
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
      }

      if (prop === 'updateOne') {
        return async (query: any, update: any) => {
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
      }

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
