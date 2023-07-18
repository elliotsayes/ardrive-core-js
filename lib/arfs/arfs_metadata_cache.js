"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArFSMetadataCache = void 0;
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path_1 = __importDefault(require("path"));
class ArFSMetadataCache {
    static platformCacheFolder() {
        var _a;
        const cacheBaseFolder = (_a = process.env['XDG_CACHE_HOME']) !== null && _a !== void 0 ? _a : os.homedir();
        return os.platform() === 'win32'
            ? path_1.default.join(cacheBaseFolder, 'ardrive-caches', 'metadata')
            : path_1.default.join(cacheBaseFolder, '.ardrive', 'caches', 'metadata');
    }
    static getCacheFolder() {
        return __awaiter(this, void 0, void 0, function* () {
            // Don't kick off another setup while setup is in progress
            if (this.cacheFolderPromise) {
                return this.cacheFolderPromise;
            }
            if (fs.existsSync(this.metadataCacheFolder)) {
                this.cacheFolderPromise = Promise.resolve(this.metadataCacheFolder);
                return this.cacheFolderPromise;
            }
            if (this.shouldCacheLog) {
                console.error(this.logTag, `Creating ArDrive metadata cache folder at ${this.metadataCacheFolder}...`);
            }
            this.cacheFolderPromise = fs.promises
                .mkdir(`${this.metadataCacheFolder}`, { recursive: true })
                .then((result) => {
                if (!result) {
                    throw new Error('Could not create persistent ArFS entity metadata cache!');
                }
                if (this.shouldCacheLog) {
                    console.error(this.logTag, `Created ArDrive metadata cache folder at ${this.metadataCacheFolder}.`);
                }
                return this.metadataCacheFolder;
            });
            return this.cacheFolderPromise;
        });
    }
    static put(txId, buffer) {
        return __awaiter(this, void 0, void 0, function* () {
            return ArFSMetadataCache.getCacheFolder().then((cacheFolder) => {
                const cacheFilePath = path_1.default.join(cacheFolder, `${txId}`);
                if (this.shouldCacheLog) {
                    console.error(this.logTag, `Caching metadata to file ${cacheFilePath}`);
                }
                return fs.promises.writeFile(cacheFilePath, buffer);
            });
        });
    }
    static get(txId) {
        return __awaiter(this, void 0, void 0, function* () {
            return ArFSMetadataCache.getCacheFolder().then((cacheFolder) => {
                const cachedFilePath = path_1.default.join(cacheFolder, `${txId}`);
                if (!fs.existsSync(cachedFilePath)) {
                    return undefined;
                }
                return fs.promises
                    .readFile(cachedFilePath)
                    .then((cachedData) => {
                    if (this.shouldCacheLog) {
                        console.error(this.logTag, `Metadata cache hit for ${txId}`);
                    }
                    return cachedData;
                })
                    .catch((err) => {
                    console.error(this.logTag, `Failed to load metadata cache file at path ${cachedFilePath}! Err: ${err}`);
                    fs.rmSync(cachedFilePath); // TODO: robustness needed
                    return undefined;
                });
            });
        });
    }
}
exports.ArFSMetadataCache = ArFSMetadataCache;
ArFSMetadataCache.shouldCacheLog = process.env['ARDRIVE_CACHE_LOG'] === '1';
ArFSMetadataCache.metadataCacheFolder = ArFSMetadataCache.platformCacheFolder();
ArFSMetadataCache.logTag = '[Metadata Cache] ';
