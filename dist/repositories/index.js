"use strict";
/**
 * Repositories barrel export
 * Centralized export for all repository modules
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.userPreferencesRepository = exports.userRepository = exports.BaseRepository = void 0;
var BaseRepository_1 = require("./BaseRepository");
Object.defineProperty(exports, "BaseRepository", { enumerable: true, get: function () { return BaseRepository_1.BaseRepository; } });
var UserRepository_1 = require("./UserRepository");
Object.defineProperty(exports, "userRepository", { enumerable: true, get: function () { return UserRepository_1.userRepository; } });
var UserPreferencesRepository_1 = require("./UserPreferencesRepository");
Object.defineProperty(exports, "userPreferencesRepository", { enumerable: true, get: function () { return UserPreferencesRepository_1.userPreferencesRepository; } });
//# sourceMappingURL=index.js.map