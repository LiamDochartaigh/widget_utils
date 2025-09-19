(() => {
  window.utils = {
    generateRandomHexId,
    hexToRgb,
    getFilterFromHex,
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
    getPronouns,
    getUserPronouns,
    // Animations
    shakeAnimConfig,
    overshootAnimConfig,
    countdownTimerAnim,
    textCharAnimConfig
  };
  var utils_default = {
    generateRandomHexId,
    hexToRgb,
    getFilterFromHex,
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
    getPronouns,
    getUserPronouns,
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
  class Color {
    r;
    g;
    b;
    constructor(r, g, b) {
      this.r = this.clamp(r);
      this.g = this.clamp(g);
      this.b = this.clamp(b);
      this.set(r, g, b);
    }
    toString() {
      return `rgb(${Math.round(this.r)}, ${Math.round(this.g)}, ${Math.round(this.b)})`;
    }
    set(r, g, b) {
      this.r = this.clamp(r);
      this.g = this.clamp(g);
      this.b = this.clamp(b);
    }
    clamp(value) {
      return Math.max(0, Math.min(255, value));
    }
    multiply(matrix) {
      const newR = this.clamp(this.r * matrix[0] + this.g * matrix[1] + this.b * matrix[2]);
      const newG = this.clamp(this.r * matrix[3] + this.g * matrix[4] + this.b * matrix[5]);
      const newB = this.clamp(this.r * matrix[6] + this.g * matrix[7] + this.b * matrix[8]);
      this.r = newR;
      this.g = newG;
      this.b = newB;
    }
    invert(value = 1) {
      this.r = this.clamp((value + this.r / 255 * (1 - 2 * value)) * 255);
      this.g = this.clamp((value + this.g / 255 * (1 - 2 * value)) * 255);
      this.b = this.clamp((value + this.b / 255 * (1 - 2 * value)) * 255);
    }
    sepia(value = 1) {
      this.multiply([
        0.393 + 0.607 * (1 - value),
        0.769 - 0.769 * (1 - value),
        0.189 - 0.189 * (1 - value),
        0.349 - 0.349 * (1 - value),
        0.686 + 0.314 * (1 - value),
        0.168 - 0.168 * (1 - value),
        0.272 - 0.272 * (1 - value),
        0.534 - 0.534 * (1 - value),
        0.131 + 0.869 * (1 - value)
      ]);
    }
    saturate(value = 1) {
      this.multiply([
        0.213 + 0.787 * value,
        0.715 - 0.715 * value,
        0.072 - 0.072 * value,
        0.213 - 0.213 * value,
        0.715 + 0.285 * value,
        0.072 - 0.072 * value,
        0.213 - 0.213 * value,
        0.715 - 0.715 * value,
        0.072 + 0.928 * value
      ]);
    }
    hueRotate(angle = 0) {
      angle = angle / 180 * Math.PI;
      const sin = Math.sin(angle);
      const cos = Math.cos(angle);
      this.multiply([
        0.213 + cos * 0.787 - sin * 0.213,
        0.715 - cos * 0.715 - sin * 0.715,
        0.072 - cos * 0.072 + sin * 0.928,
        0.213 - cos * 0.213 + sin * 0.143,
        0.715 + cos * 0.285 + sin * 0.14,
        0.072 - cos * 0.072 - sin * 0.283,
        0.213 - cos * 0.213 - sin * 0.787,
        0.715 - cos * 0.715 + sin * 0.715,
        0.072 + cos * 0.928 + sin * 0.072
      ]);
    }
    brightness(value = 1) {
      this.linear(value);
    }
    contrast(value = 1) {
      this.linear(value, -(0.5 * value) + 0.5);
    }
    linear(slope = 1, intercept = 0) {
      this.r = this.clamp(this.r * slope + intercept * 255);
      this.g = this.clamp(this.g * slope + intercept * 255);
      this.b = this.clamp(this.b * slope + intercept * 255);
    }
    hsl() {
      const r = this.r / 255;
      const g = this.g / 255;
      const b = this.b / 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0, s = 0;
      const l = (max + min) / 2;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r:
            h = (g - b) / d + (g < b ? 6 : 0);
            break;
          case g:
            h = (b - r) / d + 2;
            break;
          case b:
            h = (r - g) / d + 4;
            break;
        }
        h /= 6;
      }
      return { h: h * 100, s: s * 100, l: l * 100 };
    }
  }
  class Solver {
    target;
    targetHSL;
    reusedColor;
    constructor(target) {
      this.target = target;
      this.targetHSL = target.hsl();
      this.reusedColor = new Color(0, 0, 0);
    }
    solve() {
      const result = this.solveNarrow(this.solveWide());
      return {
        values: result.values,
        loss: result.loss,
        filter: this.css(result.values)
      };
    }
    solveWide() {
      const A = 5;
      const c = 15;
      const a = [60, 180, 18e3, 600, 1.2, 1.2];
      let best = { loss: Infinity, values: [] };
      for (let i = 0; best.loss > 25 && i < 3; i++) {
        const initial = [50, 20, 3750, 50, 100, 100];
        const result = this.spsa(A, a, c, initial, 1e3);
        if (result.loss < best.loss)
          best = result;
      }
      return best;
    }
    solveNarrow(wide) {
      const A = wide.loss;
      const c = 2;
      const A1 = A + 1;
      const a = [0.25 * A1, 0.25 * A1, A1, 0.25 * A1, 0.2 * A1, 0.2 * A1];
      return this.spsa(A, a, c, wide.values, 500);
    }
    spsa(A, a, c, values, iters) {
      const alpha = 1;
      const gamma = 1 / 6;
      let best = [];
      let bestLoss = Infinity;
      for (let k = 0; k < iters; k++) {
        const ck = c / Math.pow(k + 1, gamma);
        const deltas = Array.from({ length: 6 }, () => Math.random() > 0.5 ? 1 : -1);
        const highArgs = values.map((v, i) => v + ck * deltas[i]);
        const lowArgs = values.map((v, i) => v - ck * deltas[i]);
        const lossDiff = this.loss(highArgs) - this.loss(lowArgs);
        for (let i = 0; i < 6; i++) {
          const g = lossDiff / (2 * ck) * deltas[i];
          const ak = a[i] / Math.pow(A + k + 1, alpha);
          values[i] = this.fix(values[i] - ak * g, i);
        }
        const loss = this.loss(values);
        if (loss < bestLoss) {
          best = [...values];
          bestLoss = loss;
        }
      }
      return { values: best, loss: bestLoss };
    }
    fix(value, idx) {
      let max = 100;
      if (idx === 2)
        max = 7500;
      else if (idx === 4 || idx === 5)
        max = 200;
      if (idx === 3) {
        if (value > max)
          value %= max;
        else if (value < 0)
          value = max + value % max;
      } else {
        if (value < 0)
          value = 0;
        if (value > max)
          value = max;
      }
      return value;
    }
    loss(filters) {
      const color = this.reusedColor;
      color.set(0, 0, 0);
      color.invert(filters[0] / 100);
      color.sepia(filters[1] / 100);
      color.saturate(filters[2] / 100);
      color.hueRotate(filters[3] * 3.6);
      color.brightness(filters[4] / 100);
      color.contrast(filters[5] / 100);
      const colorHSL = color.hsl();
      return Math.abs(color.r - this.target.r) + Math.abs(color.g - this.target.g) + Math.abs(color.b - this.target.b) + Math.abs(colorHSL.h - this.targetHSL.h) + Math.abs(colorHSL.s - this.targetHSL.s) + Math.abs(colorHSL.l - this.targetHSL.l);
    }
    css(filters) {
      const fmt = (idx, multiplier = 1) => Math.round(filters[idx] * multiplier);
      return `invert(${fmt(0)}%) sepia(${fmt(1)}%) saturate(${fmt(2)}%) hue-rotate(${fmt(3, 3.6)}deg) brightness(${fmt(4)}%) contrast(${fmt(5)}%)`;
    }
  }
  function getFilterFromHex(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb)
      return null;
    const color = new Color(rgb.r, rgb.g, rgb.b);
    const solver = new Solver(color);
    const result = solver.solve();
    return result.filter;
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
  function loadVideo(url) {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.onloadeddata = () => {
        resolve(video);
      };
      video.onerror = () => {
        console.error(`Failed to load video: ${url}`);
        reject(new Error(`Failed to load video: ${url}`));
      };
      video.src = url;
      video.load();
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
  async function createAssetManager(imageAssets, audioAssets, opts = {}, videoAssets) {
    const defaultOpts = {
      ...defaultAssetManageOpts,
      ...opts
    };
    const imgAssetManager = /* @__PURE__ */ new Map();
    const audioAssetManager = /* @__PURE__ */ new Map();
    const vidAssetManager = /* @__PURE__ */ new Map();
    const loadPromises = [];
    Object.entries(imageAssets).forEach(([key, url]) => {
      const loadPromise = new Promise(async (resolve, reject) => {
        const img = await loadImage(url);
        imgAssetManager.set(key, img);
        resolve();
      });
      loadPromises.push(loadPromise);
    });
    if (videoAssets) {
      Object.entries(videoAssets).forEach(([key, url]) => {
        const loadPromise = new Promise(async (resolve, reject) => {
          const vid = await loadVideo(url);
          vidAssetManager.set(key, vid);
          resolve();
        });
        loadPromises.push(loadPromise);
      });
    }
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
      audioAssets: Array.from(audioAssetManager.entries()),
      videoAssets: Array.from(vidAssetManager.entries()),
      getVideoAssets: (key) => vidAssetManager.get(key)
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
    if (obj.event.data.channel.toLowerCase() === obj.event.data.displayName.toLocaleLowerCase())
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
  async function getPronouns() {
    const result = await fetch("https://pronouns.alejo.io/api/pronouns");
    if (!result.ok) {
      console.error("Failed to fetch pronouns:", result.status, result.statusText);
      return null;
    }
    const allPronouns = await result.json();
    return allPronouns;
  }
  async function getUserPronouns(username) {
    const lowercaseUsername = username.toLowerCase();
    const result = await fetch(`https://pronouns.alejo.io/api/users/${lowercaseUsername}`);
    if (!result.ok) {
      console.error("Failed to fetch users pronouns:", result.status, result.statusText);
      return null;
    }
    const pronouns = await result.json();
    return pronouns;
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
