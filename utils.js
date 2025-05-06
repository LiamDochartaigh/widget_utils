(() => {
  window.utils = {
    generateRandomHexId,
    hexToRgb,
    awaitAnimFrame,
    createDataStore,
    createAssetManager,
    createQueue
  };
  var utils_default = {
    generateRandomHexId,
    hexToRgb,
    awaitAnimFrame,
    createDataStore,
    createAssetManager,
    createQueue
  };
  function createQueue() {
    const queue = [];
    async function addToQueue(queueFunc) {
      if (queue.length > 0) {
        queue.push(queueFunc);
        return;
      }
      queue.push(queueFunc);
      while (queue.length > 0) {
        await queue[0]();
        queue.shift();
      }
    }
    return {
      addToQueue
    };
  }
  function generateRandomHexId(length = 8) {
    return Array.from(
      { length },
      () => Math.floor(Math.random() * 16).toString(16)
    ).join("");
  }
  function hexToRgb(hex, cssFormat = false) {
    hex = hex.replace(/^#/, "");
    let r, g, b, a = 1;
    if (hex.length === 8) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
      a = parseInt(hex.substring(6, 8), 16) / 255;
    } else {
      const bigint = parseInt(hex, 16);
      r = bigint >> 16 & 255;
      g = bigint >> 8 & 255;
      b = bigint & 255;
    }
    if (cssFormat) {
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
    return { r, g, b, a };
  }
  async function awaitAnimFrame() {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        resolve(true);
      });
    });
  }
  async function createDataStore({ defaultData, pagifiedDataKeys, storeKey, pageLength = 2 }) {
    const state = {
      localData: {}
    };
    const resetData = {
      data: { ...defaultData },
      keys: pagifiedDataKeys
    };
    const verifySavedData = (savedData) => {
      const defaultData2 = {
        pagifiedDataStores: {},
        data: {}
      };
      for (let index = 0; index < Object.keys(defaultData2).length; index++) {
        const key = Object.keys(defaultData2)[index];
        if (!savedData[key]) {
          console.log(`Key mismatch, using default data for ${key}`);
          return false;
        }
      }
      return true;
    };
    const _loadData = async (savedData) => {
      if (!savedData) {
        return getDefaultData();
      }
      if (!verifySavedData(savedData)) {
        return getDefaultData();
      }
      console.log("Valid Data Retrieved", savedData);
      const pagifiedDataConcat = {};
      for (const [index, _] of Object.entries(savedData.pagifiedDataStores).entries()) {
        const pages = savedData.pagifiedDataStores[pagifiedDataKeys[index]];
        let combinedPages = {};
        const pagePromises = pages.map(async (key) => {
          const value = JSON.parse((await SE_API.store.get(key)).value);
          return [key, value];
        });
        const entries = await Promise.all(pagePromises);
        combinedPages = Object.fromEntries(entries);
        pagifiedDataConcat[pagifiedDataKeys[index]] = combinedPages;
      }
      return {
        flatData: savedData.data,
        pagifiedDataStores: pagifiedDataConcat
      };
    };
    const getDefaultData = () => {
      return {
        flatData: { ...resetData.data },
        pagifiedDataStores: {
          ...resetData.keys.reduce((obj, key) => {
            obj[key] = {};
            return obj;
          }, {})
        }
      };
    };
    const resetDataStore = async (test) => {
      const savePromises = [];
      Object.keys(state.localData.pagifiedDataStores).forEach((_, index) => {
        const pageDataKey = pagifiedDataKeys[index];
        const pages = state.localData.pagifiedDataStores[pageDataKey];
        Object.entries(pages).forEach(async ([key, _2]) => {
          savePromises.push(SE_API.store.set(key, JSON.stringify({})));
        });
      });
      await Promise.all(savePromises);
      state.localData = getDefaultData();
      await saveData();
    };
    const saveData = async (shallow = false) => {
      let pageDataKeys = {};
      const savePromises = [];
      Object.keys(state.localData.pagifiedDataStores).forEach(async (_, index) => {
        const pageDataKey = pagifiedDataKeys[index];
        const pages = state.localData.pagifiedDataStores[pageDataKey];
        let pageStoreKeys = [];
        Object.entries(pages).forEach(async ([key, value]) => {
          pageStoreKeys.push(key);
          if (!shallow) {
            savePromises.push(SE_API.store.set(key, JSON.stringify(value)));
          }
        });
        pageDataKeys = {
          ...pageDataKeys,
          [pageDataKey]: pageStoreKeys
        };
      });
      await Promise.all(savePromises);
      const saveData2 = {
        pagifiedDataStores: pageDataKeys,
        data: state.localData.flatData
      };
      await SE_API.store.set(storeKey, JSON.stringify(saveData2));
    };
    const updatePagifiedValue = (dataKey, savedKey, newVal) => {
      let previousEntryPage = void 0;
      Object.entries(state.localData.pagifiedDataStores[dataKey]).some(([pageKey, val]) => {
        if (val[savedKey]) {
          previousEntryPage = pageKey;
          return true;
        }
        return false;
      });
      if (previousEntryPage) {
        state.localData.pagifiedDataStores[dataKey][previousEntryPage][savedKey] = newVal;
      } else if (Object.entries(state.localData.pagifiedDataStores[dataKey]).length === 0) {
        const key = `${storeKey}_${dataKey}_p1`;
        state.localData.pagifiedDataStores[dataKey] = {
          [key]: {
            [savedKey]: newVal
          }
        };
      } else {
        let pageKey = Object.keys(state.localData.pagifiedDataStores[dataKey]).at(-1);
        const lastPageData = state.localData.pagifiedDataStores[dataKey][pageKey];
        if (!lastPageData)
          return;
        if (Object.entries(lastPageData).length + 1 > pageLength) {
          pageKey = `${storeKey}_${dataKey}_p${Object.keys(state.localData.pagifiedDataStores[dataKey]).length + 1}`;
          state.localData.pagifiedDataStores[dataKey] = {
            ...state.localData.pagifiedDataStores[dataKey],
            [pageKey]: {
              [savedKey]: {}
            }
          };
        }
        state.localData.pagifiedDataStores[dataKey] = {
          ...state.localData.pagifiedDataStores[dataKey],
          [pageKey]: {
            ...state.localData.pagifiedDataStores[dataKey][pageKey],
            [savedKey]: newVal
          }
        };
      }
    };
    const getPagifiedValue = (dataKey, key) => {
      if (!state.localData.pagifiedDataStores[dataKey])
        state.localData.pagifiedDataStores[dataKey] = {};
      const entry = Object.entries(state.localData.pagifiedDataStores[dataKey]).find(([_, value]) => {
        return value[key] !== void 0;
      });
      return entry ? entry[1][key] : void 0;
    };
    const getPagifiedData = (key) => {
      let combinedData = {};
      Object.entries(state.localData.pagifiedDataStores[key]).forEach(([pageKey, value]) => {
        combinedData = {
          ...combinedData,
          [pageKey]: value
        };
      });
      return combinedData;
    };
    state.localData = await _loadData(JSON.parse((await SE_API.store.get(storeKey)).value));
    return {
      get data() {
        return state.localData;
      },
      updatePagifiedValue,
      getPagifiedValue,
      getPagifiedData,
      saveData,
      resetDataStore,
      loadData: async (data) => {
        state.localData = await _loadData(data);
      }
    };
  }
  async function createAssetManager(assets) {
    const assetManager = /* @__PURE__ */ new Map();
    const loadPromises = [];
    Object.entries(assets).forEach(([key, url]) => {
      const loadPromise = new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          assetManager.set(key, img);
          resolve();
        };
        img.onerror = () => {
          console.error(`Failed to load image: ${url}`);
          reject(new Error(`Failed to load image: ${url}`));
        };
        img.src = url;
      });
      loadPromises.push(loadPromise);
    });
    await Promise.all(loadPromises);
    return {
      get: (key) => assetManager.get(key),
      assets: Array.from(assetManager.entries())
    };
  }
})();
