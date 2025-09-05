"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.Sidebar = void 0;
var _react = _interopRequireWildcard(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _settings = require("../settings");
var _Scroll = _interopRequireDefault(require("../Scroll"));
var _classnames = _interopRequireDefault(require("classnames"));
var _Overlay = _interopRequireDefault(require("../Overlay"));
var _Loader = _interopRequireDefault(require("../Loader"));
var _excluded = ["children", "position", "scrollable", "loading", "className"],
  _excluded2 = ["children"];
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t in e) "default" !== _t && {}.hasOwnProperty.call(e, _t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t)) && (i.get || i.set) ? o(f, _t, i) : f[_t] = e[_t]); return f; })(e, t); }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function _objectWithoutProperties(e, t) { if (null == e) return {}; var o, r, i = _objectWithoutPropertiesLoose(e, t); if (Object.getOwnPropertySymbols) { var n = Object.getOwnPropertySymbols(e); for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]); } return i; }
function _objectWithoutPropertiesLoose(r, e) { if (null == r) return {}; var t = {}; for (var n in r) if ({}.hasOwnProperty.call(r, n)) { if (-1 !== e.indexOf(n)) continue; t[n] = r[n]; } return t; }
var Sidebar = exports.Sidebar = function Sidebar(_ref) {
  var _ref$children = _ref.children,
    children = _ref$children === void 0 ? undefined : _ref$children,
    _ref$position = _ref.position,
    position = _ref$position === void 0 ? undefined : _ref$position,
    _ref$scrollable = _ref.scrollable,
    scrollable = _ref$scrollable === void 0 ? true : _ref$scrollable,
    _ref$loading = _ref.loading,
    loading = _ref$loading === void 0 ? false : _ref$loading,
    _ref$className = _ref.className,
    className = _ref$className === void 0 ? "" : _ref$className,
    props = _objectWithoutProperties(_ref, _excluded);
  var cName = "".concat(_settings.prefix, "-sidebar");
  var sideClass = function () {
    if (position === "left") {
      return "".concat(cName, "--left");
    } else if (position === "right") {
      return "".concat(cName, "--right");
    } else {
      return "";
    }
  }();

  /* eslint-disable react/display-name*/
  var Tag = (0, _react.useMemo)(function () {
    return function (_ref2) {
      var children = _ref2.children,
        rest = _objectWithoutProperties(_ref2, _excluded2);
      // PerfectScrollbar for now can't be disabled, so render div instead of disabling it
      // https://github.com/goldenyz/react-perfect-scrollbar/issues/107
      if (scrollable === false || scrollable === true && loading === true) {
        return /*#__PURE__*/_react["default"].createElement("div", rest, loading && /*#__PURE__*/_react["default"].createElement(_Overlay["default"], null, /*#__PURE__*/_react["default"].createElement(_Loader["default"], null)), children);
      } else {
        return /*#__PURE__*/_react["default"].createElement(_Scroll["default"], rest, children);
      }
    };
  }, [scrollable, loading]);
  return /*#__PURE__*/_react["default"].createElement(Tag, _extends({}, props, {
    className: (0, _classnames["default"])(cName, sideClass, className)
  }), children);
};
process.env.NODE_ENV !== "production" ? Sidebar.propTypes = {
  /** Primary content. */
  children: _propTypes["default"].node,
  /** Sidebar can be placed on two positions */
  position: _propTypes["default"].oneOf(["left", "right"]),
  /** Sidebar can be scrollable */
  scrollable: _propTypes["default"].bool,
  /** Loading flag. */
  loading: _propTypes["default"].bool,
  /** Additional classes. */
  className: _propTypes["default"].string
} : void 0;
var _default = exports["default"] = Sidebar;