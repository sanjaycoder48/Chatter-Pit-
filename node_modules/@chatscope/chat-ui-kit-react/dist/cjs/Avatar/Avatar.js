"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.Avatar = void 0;
var _react = _interopRequireWildcard(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _settings = require("../settings");
var _classnames = _interopRequireDefault(require("classnames"));
var _Status = require("../Status/Status");
var _enums = require("../enums");
var _excluded = ["name", "src", "size", "status", "className", "active", "children"];
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t in e) "default" !== _t && {}.hasOwnProperty.call(e, _t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t)) && (i.get || i.set) ? o(f, _t, i) : f[_t] = e[_t]); return f; })(e, t); }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _objectWithoutProperties(e, t) { if (null == e) return {}; var o, r, i = _objectWithoutPropertiesLoose(e, t); if (Object.getOwnPropertySymbols) { var n = Object.getOwnPropertySymbols(e); for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]); } return i; }
function _objectWithoutPropertiesLoose(r, e) { if (null == r) return {}; var t = {}; for (var n in r) if ({}.hasOwnProperty.call(r, n)) { if (-1 !== e.indexOf(n)) continue; t[n] = r[n]; } return t; }
function AvatarInner(_ref, ref) {
  var _ref$name = _ref.name,
    name = _ref$name === void 0 ? "" : _ref$name,
    _ref$src = _ref.src,
    src = _ref$src === void 0 ? "" : _ref$src,
    _ref$size = _ref.size,
    size = _ref$size === void 0 ? "md" : _ref$size,
    status = _ref.status,
    className = _ref.className,
    _ref$active = _ref.active,
    active = _ref$active === void 0 ? false : _ref$active,
    children = _ref.children,
    rest = _objectWithoutProperties(_ref, _excluded);
  var cName = "".concat(_settings.prefix, "-avatar");
  var sizeClass = typeof size !== "undefined" ? " ".concat(cName, "--").concat(size) : "";
  var avatarRef = (0, _react.useRef)();
  (0, _react.useImperativeHandle)(ref, function () {
    return {
      focus: function focus() {
        return avatarRef.current.focus();
      }
    };
  });
  return /*#__PURE__*/_react["default"].createElement("div", _extends({
    ref: avatarRef
  }, rest, {
    className: (0, _classnames["default"])("".concat(cName).concat(sizeClass), _defineProperty({}, "".concat(cName, "--active"), active), className)
  }), children ? children : /*#__PURE__*/_react["default"].createElement(_react["default"].Fragment, null, /*#__PURE__*/_react["default"].createElement("img", {
    src: src,
    alt: name
  }), typeof status === "string" && /*#__PURE__*/_react["default"].createElement(_Status.Status, {
    status: status,
    size: size
  }), " "));
}
var Avatar = exports.Avatar = /*#__PURE__*/(0, _react.forwardRef)(AvatarInner);
Avatar.displayName = "Avatar";
Avatar.propTypes = {
  /** Primary content */
  children: _propTypes["default"].node,
  /**
   * User name/nickname/full name for displaying initials and image alt description
   */
  name: _propTypes["default"].string,
  /** Avatar image source */
  src: _propTypes["default"].string,
  /** Size */
  size: _propTypes["default"].oneOf(_enums.SizeEnum),
  /** Status. */
  status: _propTypes["default"].oneOf(_enums.StatusEnum),
  /** Active */
  active: _propTypes["default"].bool,
  /** Additional classes. */
  className: _propTypes["default"].string
};
process.env.NODE_ENV !== "production" ? AvatarInner.propTypes = Avatar.propTypes : void 0;
var _default = exports["default"] = Avatar;