(() => {
  window.utils = {
    generateRandomHexId,
    hexToRgb,
    awaitAnimFrame,
    throttle,
    awaitDelay,
    awaitWhileLoop,
    createDataStore,
    createQueue,
    createAssetManager,
    loadImage,
    loadAudio,
    replaceTextPlaceholders,
    // Twitch Utils
    formatChannelPoints,
    isCommand,
    isMsgFromAdmin,
    getTwitchUser,
    // Animations
    shakeAnimConfig,
    overshootAnimConfig,
    countdownTimerAnim,
    textCharAnimConfig
  };
  var utils_default = {
    generateRandomHexId,
    hexToRgb,
    awaitAnimFrame,
    throttle,
    awaitDelay,
    awaitWhileLoop,
    createDataStore,
    createQueue,
    createAssetManager,
    loadImage,
    loadAudio,
    replaceTextPlaceholders,
    // Twitch Utils
    formatChannelPoints,
    isCommand,
    isMsgFromAdmin,
    getTwitchUser,
    // Animations
    shakeAnimConfig,
    overshootAnimConfig,
    countdownTimerAnim,
    textCharAnimConfig
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
      addToQueue,
      getLength: () => queue.length
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
      console.log("Widget Data Loaded from SE_API Store");
      const pagifiedDataConcat = {};
      for (const [index, _] of Object.entries(savedData.pagifiedDataStores).entries()) {
        const pages = savedData.pagifiedDataStores[pagifiedDataKeys[index]];
        let combinedPages = {};
        const pagePromises = pages.map(async (key) => {
          const value = JSON.parse((await SE_API.store.get(key))?.value);
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
    const resetDataStore = async () => {
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
    const currentSavedData = await SE_API.store.get(storeKey);
    if (!currentSavedData) {
      state.localData = await _loadData(null);
    } else {
      state.localData = await _loadData(JSON.parse(currentSavedData.value));
    }
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
  const defaultAssetManageOpts = {
    audioPoolSize: 5,
    preLoadAudio: true
  };
  async function loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve(img);
      };
      img.onerror = () => {
        console.error(`Failed to load image: ${url}`);
        reject(new Error(`Failed to load image: ${url}`));
      };
      img.src = url;
    });
  }
  function loadAudio(url) {
    return new Promise((resolve, reject) => {
      const audio = new Audio(url);
      audio.preload = "auto";
      audio.oncanplaythrough = () => {
        resolve(audio);
      };
      audio.onerror = () => {
        console.error(`Failed to load audio: ${url}`);
        reject(new Error(`Failed to load audio: ${url}`));
      };
      audio.load();
    });
  }
  async function createAssetManager(imageAssets, audioAssets, opts = {}) {
    const defaultOpts = {
      ...defaultAssetManageOpts,
      ...opts
    };
    const imgAssetManager = /* @__PURE__ */ new Map();
    const audioAssetManager = /* @__PURE__ */ new Map();
    const loadPromises = [];
    Object.entries(imageAssets).forEach(([key, url]) => {
      const loadPromise = new Promise(async (resolve, reject) => {
        const img = await loadImage(url);
        imgAssetManager.set(key, img);
        resolve();
      });
      loadPromises.push(loadPromise);
    });
    if (audioAssets && defaultOpts.preLoadAudio) {
      Object.entries(audioAssets).forEach(([key, url]) => {
        const loadPromise = new Promise(async (resolve, reject) => {
          const audioPool = await createAudioPool(url, defaultOpts.audioPoolSize);
          audioAssetManager.set(key, audioPool);
          resolve();
        });
        loadPromises.push(loadPromise);
      });
    }
    await Promise.all(loadPromises);
    return {
      getImageAsset: (key) => imgAssetManager.get(key),
      imageAssets: Array.from(imgAssetManager.entries()),
      getAudioPool: (key) => audioAssetManager.get(key),
      audioAssets: Array.from(audioAssetManager.entries())
    };
  }
  function createAudioPool(url, poolSize) {
    return new Promise((resolve, reject) => {
      let currentIndex = 0;
      const pool = [];
      const play = (volume) => {
        const audioToPlay = pool[currentIndex];
        audioToPlay.currentTime = 0;
        audioToPlay.volume = volume;
        audioToPlay.play();
        currentIndex = (currentIndex + 1) % poolSize;
      };
      let loaded = 0;
      for (let i = 0; i < poolSize; i++) {
        loadAudio(url).then((audio) => {
          pool.push(audio);
          loaded++;
          if (loaded === poolSize) {
            resolve({ play, pool });
          }
        });
      }
    });
  }
  function isCommand(value, expectedCommand) {
    if (!expectedCommand.startsWith("!")) {
      return false;
    }
    const firstWord = value.split(" ")[0].toLowerCase();
    return firstWord === expectedCommand.toLowerCase();
  }
  function isMsgFromAdmin(obj, {
    viewerControl,
    vipControl,
    subControl,
    modControl,
    modWhitelist
  }) {
    if (obj.event.data.channel === obj.event.data.displayName)
      return true;
    if (viewerControl)
      return true;
    if (vipControl && obj.event.data.badges?.map((badge) => badge.type).includes("vip"))
      return true;
    if (subControl && (obj.event.data.tags.subscriber === "0" ? false : true))
      return true;
    if (modControl) {
      const isChannelMod = obj.event.data.tags.mod === "0" ? false : true;
      if ((modWhitelist == void 0 || modWhitelist == null) && isChannelMod)
        return true;
      if (modWhitelist && isChannelMod && modWhitelist.split(",").map((mod) => mod.trim()).some((mod) => mod.trim().toLowerCase() === obj.event.data.displayName.toLowerCase()))
        return true;
    }
    return false;
  }
  function throttle(callback, delay) {
    let lastCall = 0;
    return function() {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        callback();
      }
    };
  }
  function awaitDelay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  function awaitWhileLoop(condition, delay, maxWaitTime) {
    return new Promise(async (resolve) => {
      if (!condition) {
        resolve();
        return;
      }
      let timeoutId;
      let hasTimedOut = false;
      if (maxWaitTime !== void 0) {
        timeoutId = setTimeout(() => {
          hasTimedOut = true;
          resolve();
        }, maxWaitTime);
      }
      while (condition() && !hasTimedOut) {
        await awaitDelay(delay);
      }
      if (!hasTimedOut) {
        if (timeoutId)
          clearTimeout(timeoutId);
        resolve();
      }
    });
  }
  function formatChannelPoints(value) {
    if (value >= 1e3) {
      return (value / 1e3).toFixed(0) + "k";
    } else {
      return value.toString();
    }
  }
  function replaceTextPlaceholders(text, replacements) {
    const placeholderPattern = new RegExp(`(${Object.keys(replacements).map(
      (key) => key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    ).join("|")})`, "g");
    const parts = text.split(placeholderPattern);
    return parts.filter((part) => part !== "").map((part) => {
      if (part in replacements) {
        return replacements[part];
      } else {
        return `<span>${part}</span>`;
      }
    }).join("");
  }
  async function getTwitchUser({ userLogin, token, dev = false }) {
    const requestUrl = dev ? "http://localhost:3000" : "https://charmingstreams.com";
    const result = await fetch(`${requestUrl}/api/twitch/get-user?login=${userLogin}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        token
      })
    });
    if (!result.ok) {
      console.error("Failed to fetch Twitch user:", result.status, result.statusText);
      return null;
    }
    return await result.json();
  }
  function shakeAnimConfig(opts) {
    const defaults = {
      intensity: 5,
      duration: 800,
      easing: "easeInOutSine",
      loops: 3,
      delay: 0,
      direction: "horizontal"
    };
    const config = { ...defaults, ...opts };
    const translate = config.direction === "horizontal" ? "translateX" : "translateY";
    return {
      targets: config.selector,
      [translate]: [
        { value: 0, duration: 0 },
        { value: config.intensity, duration: config.duration / (config.loops * 4) },
        { value: -config.intensity, duration: config.duration / (config.loops * 2) },
        { value: config.intensity, duration: config.duration / (config.loops * 2) },
        { value: -config.intensity, duration: config.duration / (config.loops * 2) },
        { value: 0, duration: config.duration / (config.loops * 4) }
      ],
      duration: config.duration,
      easing: config.easing,
      delay: config.delay,
      loop: false
    };
  }
  function overshootAnimConfig(opts) {
    const defaults = {
      duration: 800,
      easing: "easeInOutSine",
      delay: 0,
      overshootDurationPercent: 0.6
    };
    const config = { ...defaults, ...opts };
    return {
      targets: config.selector,
      [config.animeProperty]: [
        {
          value: config.start,
          duration: 0
        },
        {
          value: config.overshoot,
          duration: config.duration * config.overshootDurationPercent,
          easing: "easeInOutQuad"
        },
        {
          value: config.end,
          duration: config.duration * (1 - config.overshootDurationPercent),
          easing: "easeInOutQuad"
        }
      ],
      duration: config.duration,
      easing: config.easing,
      delay: config.delay,
      loop: false
    };
  }
  function countdownTimerAnim(opts) {
    return {
      duration: opts.seconds * 1e3,
      begin: function(anim) {
        this.timeLeft = Math.floor(opts.seconds);
        this.urgent = false;
      },
      update: function(anim) {
        const timeLeft = Math.floor((anim.duration - anim.currentTime) / 1e3);
        if (opts?.urgencyCB && opts.urgencyTime && !this.urgent && timeLeft <= opts.urgencyTime) {
          this.urgent = true;
          opts.urgencyCB();
        }
        if (timeLeft !== this.timeLeft) {
          this.timeLeft = timeLeft;
          opts.timeUpd(timeLeft);
        }
      }
    };
  }
  function textCharAnimConfig(opts) {
    const defaults = {
      duration: 800,
      easing: "easeInOutSine",
      delayRange: [0, 100]
    };
    const config = { ...defaults, ...opts };
    let delays = [];
    $(config.selector).each(function(index, element) {
      const text = element.innerText.split("");
      $(element).html(text.map((char, index2) => {
        const displayClass = char.trim() === "" ? "d-inline" : "d-inline-block";
        return `<span class="char-split ${displayClass}">${char}</span>`;
      }).join(""));
      delays = delays.concat(Array.from({ length: text.length }, () => {
        const min = config.delayRange[0];
        const max = config.delayRange[1];
        return Math.random() * (max - min) + min;
      }));
    });
    return {
      targets: `${config.selector} .char-split`,
      [config.animeProperty]: [config.start, config.end],
      delay: function(el, i) {
        const delay = delays[i];
        return delay;
      },
      duration: config.duration,
      easing: config.easing
    };
    ;
  }
})();
