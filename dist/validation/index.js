"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.idParamSchema = exports.paginationSchema = exports.commonFields = exports.commonOptions = exports.validateObjectId = exports.validate = exports.analyticsValidation = exports.paymentValidation = exports.gamificationValidation = exports.quizValidation = exports.chatValidation = exports.sessionValidation = exports.userValidation = exports.authValidation = void 0;
// Export all validation schemas for easy importing
exports.authValidation = __importStar(require("./auth"));
exports.userValidation = __importStar(require("./user"));
exports.sessionValidation = __importStar(require("./session"));
exports.chatValidation = __importStar(require("./chat"));
exports.quizValidation = __importStar(require("./quiz"));
exports.gamificationValidation = __importStar(require("./gamification"));
exports.paymentValidation = __importStar(require("./payment"));
exports.analyticsValidation = __importStar(require("./analytics"));
// Export middleware and common utilities
var middleware_1 = require("./middleware");
Object.defineProperty(exports, "validate", { enumerable: true, get: function () { return middleware_1.validate; } });
Object.defineProperty(exports, "validateObjectId", { enumerable: true, get: function () { return middleware_1.validateObjectId; } });
Object.defineProperty(exports, "commonOptions", { enumerable: true, get: function () { return middleware_1.commonOptions; } });
var common_1 = require("./common");
Object.defineProperty(exports, "commonFields", { enumerable: true, get: function () { return common_1.commonFields; } });
Object.defineProperty(exports, "paginationSchema", { enumerable: true, get: function () { return common_1.paginationSchema; } });
Object.defineProperty(exports, "idParamSchema", { enumerable: true, get: function () { return common_1.idParamSchema; } });
//# sourceMappingURL=index.js.map