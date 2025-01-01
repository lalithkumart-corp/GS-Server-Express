"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _express = _interopRequireDefault(require("express"));
var _config = require("../config/config");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
var router = _express["default"].Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  console.log(_config.appConfig.test);
  console.log(_config.appConfig.test2);
  res.json({
    title: 'Express'
  });
});
var _default = exports["default"] = router;