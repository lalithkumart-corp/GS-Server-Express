"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.envConfig = void 0;
var _dotenv = _interopRequireDefault(require("dotenv"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
_dotenv["default"].config();
var envConfig = exports.envConfig = {
  test: process.env.TEST_LETTER
};