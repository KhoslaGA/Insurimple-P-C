/* @ds-bundle: {"format":4,"namespace":"InsurimpleDesignSystem_63f438","components":[{"name":"Avatar","sourcePath":"components/data/Avatar.jsx"},{"name":"Badge","sourcePath":"components/data/Badge.jsx"},{"name":"Chip","sourcePath":"components/data/Chip.jsx"},{"name":"ListRow","sourcePath":"components/data/ListRow.jsx"},{"name":"MetricCard","sourcePath":"components/data/MetricCard.jsx"},{"name":"Table","sourcePath":"components/data/Table.jsx"},{"name":"EmptyState","sourcePath":"components/feedback/EmptyState.jsx"},{"name":"Spinner","sourcePath":"components/feedback/Spinner.jsx"},{"name":"Button","sourcePath":"components/forms/Button.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Field","sourcePath":"components/forms/Field.jsx"},{"name":"IconButton","sourcePath":"components/forms/IconButton.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Radio","sourcePath":"components/forms/Radio.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Drawer","sourcePath":"components/overlay/Drawer.jsx"},{"name":"Modal","sourcePath":"components/overlay/Modal.jsx"},{"name":"Tabs","sourcePath":"components/overlay/Tabs.jsx"},{"name":"Toast","sourcePath":"components/overlay/Toast.jsx"}],"sourceHashes":{"components/data/Avatar.jsx":"8c32f07158c3","components/data/Badge.jsx":"74572d10685e","components/data/Chip.jsx":"d69fcf28b383","components/data/ListRow.jsx":"470685a5bd4b","components/data/MetricCard.jsx":"8e3f677482a0","components/data/Table.jsx":"72e80683935f","components/feedback/EmptyState.jsx":"830632790676","components/feedback/Spinner.jsx":"bae57b04a8b9","components/forms/Button.jsx":"d8bf19a604f9","components/forms/Checkbox.jsx":"fdbcacd69570","components/forms/Field.jsx":"a8cd59a0fd09","components/forms/IconButton.jsx":"ab217c2b00cc","components/forms/Input.jsx":"8cea96abd906","components/forms/Radio.jsx":"7572c6445b8f","components/forms/Select.jsx":"aa2fb7c6bd13","components/forms/Switch.jsx":"2e919903d0f0","components/overlay/Drawer.jsx":"253d6c73d8f1","components/overlay/Modal.jsx":"8fb99321d38f","components/overlay/Tabs.jsx":"d0d8880e4f80","components/overlay/Toast.jsx":"ef53eb6bdf9c","ui_kits/insurimple_app/AppShell.jsx":"44db2302e209","ui_kits/insurimple_app/Bms.jsx":"32b8d3d01e73","ui_kits/insurimple_app/Bms2.jsx":"e87756dfbe8c","ui_kits/insurimple_app/ContactRecord.jsx":"33f60f59db12","ui_kits/insurimple_app/Crm.jsx":"e77f9ad7963f","ui_kits/insurimple_app/Dashboards.jsx":"bf1a37c1243b","ui_kits/insurimple_app/Docs.jsx":"97104b7f7a69","ui_kits/insurimple_app/Global.jsx":"81ccbfdeb27c","ui_kits/insurimple_app/Growth.jsx":"6d2534445139","ui_kits/insurimple_app/Settings.jsx":"d9878bd11d70","ui_kits/insurimple_app/Softphone.jsx":"1df7c9e46da3","ui_kits/rate_family/Landing.jsx":"29e242cdfb60","ui_kits/rate_family/Quoter.jsx":"fbe78702e9b1"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.InsurimpleDesignSystem_63f438 = window.InsurimpleDesignSystem_63f438 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/data/Avatar.jsx
try { (() => {
const hues = ["#12796A", "#33608C", "#C4544B", "#B0803B", "#5B3A8C", "#5B6B70"];
function Avatar({
  name = "",
  size = "md",
  src,
  style
}) {
  const dim = {
    sm: 26,
    md: 34,
    lg: 44
  }[size];
  const initials = name.split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  const hue = hues[(name.charCodeAt(0) || 0) % hues.length];
  return /*#__PURE__*/React.createElement("span", {
    title: name,
    style: {
      width: dim,
      height: dim,
      flex: "none",
      borderRadius: "50%",
      overflow: "hidden",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      background: src ? "var(--surface-sunken)" : hue,
      color: "#fff",
      fontSize: dim * 0.38,
      fontWeight: 500,
      fontFamily: "var(--font-sans)",
      ...style
    }
  }, src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name,
    style: {
      width: "100%",
      height: "100%",
      objectFit: "cover"
    }
  }) : initials);
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/data/Badge.jsx
try { (() => {
const tones = {
  neutral: ["var(--surface-sunken)", "var(--text-2)"],
  accent: ["var(--tenant-primary-tint)", "var(--tenant-primary-deep)"],
  success: ["var(--success-tint)", "var(--success)"],
  warning: ["var(--warning-tint)", "var(--warning)"],
  danger: ["var(--danger-tint)", "var(--danger)"],
  info: ["var(--info-tint)", "var(--info)"]
};
function Badge({
  tone = "neutral",
  dot,
  children,
  style
}) {
  const [bg, fg] = tones[tone] || tones.neutral;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "2px 10px",
      borderRadius: 999,
      background: bg,
      color: fg,
      fontSize: 12,
      fontWeight: 500,
      fontFamily: "var(--font-sans)",
      lineHeight: 1.6,
      whiteSpace: "nowrap",
      ...style
    }
  }, dot ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: "50%",
      background: fg
    }
  }) : null, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Badge.jsx", error: String((e && e.message) || e) }); }

// components/data/Chip.jsx
try { (() => {
function Chip({
  selected,
  icon,
  onRemove,
  children,
  onClick,
  style
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("span", {
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "5px 12px",
      borderRadius: 999,
      cursor: onClick ? "pointer" : "default",
      border: `1px solid ${selected ? "var(--tenant-primary)" : "var(--border-2)"}`,
      background: selected ? "var(--tenant-primary-tint)" : hover && onClick ? "var(--surface-sunken)" : "var(--surface-card)",
      color: selected ? "var(--tenant-primary-deep)" : "var(--text-2)",
      fontSize: 13,
      fontWeight: 500,
      fontFamily: "var(--font-sans)",
      transition: "background var(--duration-quick) var(--ease-quiet)",
      userSelect: "none",
      ...style
    }
  }, icon ? /*#__PURE__*/React.createElement("i", {
    className: `ti ti-${icon}`,
    style: {
      fontSize: 15
    }
  }) : null, children, onRemove ? /*#__PURE__*/React.createElement("i", {
    className: "ti ti-x",
    onClick: e => {
      e.stopPropagation();
      onRemove();
    },
    style: {
      fontSize: 13,
      cursor: "pointer",
      opacity: 0.7
    }
  }) : null);
}
Object.assign(__ds_scope, { Chip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Chip.jsx", error: String((e && e.message) || e) }); }

// components/data/ListRow.jsx
try { (() => {
function ListRow({
  leading,
  title,
  subtitle,
  meta,
  trailing,
  onClick,
  selected,
  style
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "10px 14px",
      cursor: onClick ? "pointer" : "default",
      background: selected ? "var(--tenant-primary-tint)" : hover && onClick ? "var(--surface-panel)" : "transparent",
      borderBottom: "1px solid var(--border-1)",
      fontFamily: "var(--font-sans)",
      transition: "background var(--duration-quick) var(--ease-quiet)",
      ...style
    }
  }, leading, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 500,
      color: "var(--text-1)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, title), subtitle ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-2)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, subtitle) : null), meta ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-3)",
      flex: "none"
    }
  }, meta) : null, trailing);
}
Object.assign(__ds_scope, { ListRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/ListRow.jsx", error: String((e && e.message) || e) }); }

// components/data/MetricCard.jsx
try { (() => {
function MetricCard({
  label,
  value,
  delta,
  deltaTone = "neutral",
  hint,
  icon,
  style
}) {
  const toneColor = {
    up: "var(--success)",
    down: "var(--danger)",
    neutral: "var(--text-2)"
  }[deltaTone] || "var(--text-2)";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-1)",
      borderRadius: "var(--radius-card)",
      padding: "var(--space-4)",
      display: "flex",
      flexDirection: "column",
      gap: 4,
      fontFamily: "var(--font-sans)",
      minWidth: 0,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontSize: 11,
      fontWeight: 500,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: "var(--text-3)"
    }
  }, icon ? /*#__PURE__*/React.createElement("i", {
    className: `ti ti-${icon}`,
    style: {
      fontSize: 14,
      color: "var(--tenant-primary)"
    }
  }) : null, label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 28,
      fontWeight: 500,
      color: "var(--text-1)",
      lineHeight: 1.2,
      fontVariantNumeric: "tabular-nums"
    }
  }, value), delta || hint ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-2)",
      display: "flex",
      gap: 6,
      alignItems: "baseline"
    }
  }, delta ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: toneColor,
      fontWeight: 500
    }
  }, delta) : null, hint) : null);
}
Object.assign(__ds_scope, { MetricCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/MetricCard.jsx", error: String((e && e.message) || e) }); }

// components/data/Table.jsx
try { (() => {
function Table({
  columns = [],
  rows = [],
  onRowClick,
  style
}) {
  const [hoverRow, setHoverRow] = React.useState(-1);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-1)",
      borderRadius: "var(--radius-card)",
      overflow: "hidden",
      fontFamily: "var(--font-sans)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: 14
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, columns.map((c, i) => /*#__PURE__*/React.createElement("th", {
    key: i,
    style: {
      textAlign: c.align || "left",
      padding: "10px 14px",
      fontSize: 11,
      fontWeight: 500,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: "var(--text-3)",
      borderBottom: "1px solid var(--border-1)",
      background: "var(--surface-panel)",
      whiteSpace: "nowrap"
    }
  }, c.header)))), /*#__PURE__*/React.createElement("tbody", null, rows.map((r, ri) => /*#__PURE__*/React.createElement("tr", {
    key: ri,
    onClick: onRowClick ? () => onRowClick(r, ri) : undefined,
    onMouseEnter: () => setHoverRow(ri),
    onMouseLeave: () => setHoverRow(-1),
    style: {
      cursor: onRowClick ? "pointer" : "default",
      background: hoverRow === ri && onRowClick ? "var(--surface-panel)" : "transparent",
      transition: "background var(--duration-quick) var(--ease-quiet)"
    }
  }, columns.map((c, ci) => /*#__PURE__*/React.createElement("td", {
    key: ci,
    style: {
      padding: "10px 14px",
      textAlign: c.align || "left",
      color: "var(--text-1)",
      borderBottom: ri < rows.length - 1 ? "1px solid var(--border-1)" : "none",
      fontVariantNumeric: "tabular-nums"
    }
  }, c.render ? c.render(r, ri) : r[c.key])))))));
}
Object.assign(__ds_scope, { Table });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Table.jsx", error: String((e && e.message) || e) }); }

// components/feedback/EmptyState.jsx
try { (() => {
function EmptyState({
  icon = "inbox",
  title,
  body,
  action,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      padding: "40px 24px",
      textAlign: "center",
      fontFamily: "var(--font-sans)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 48,
      height: 48,
      borderRadius: 12,
      background: "var(--tenant-primary-tint)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "var(--tenant-primary)"
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: `ti ti-${icon}`,
    style: {
      fontSize: 24
    }
  })), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "4px 0 0",
      fontSize: 16,
      fontWeight: 500,
      color: "var(--text-1)"
    }
  }, title), body ? /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 14,
      color: "var(--text-2)",
      maxWidth: 340,
      lineHeight: 1.55
    }
  }, body) : null, action ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8
    }
  }, action) : null);
}
Object.assign(__ds_scope, { EmptyState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/EmptyState.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Spinner.jsx
try { (() => {
function Spinner({
  size = 20,
  style
}) {
  return /*#__PURE__*/React.createElement("span", {
    "aria-label": "Loading",
    style: {
      display: "inline-block",
      width: size,
      height: size,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      width: "100%",
      height: "100%",
      borderRadius: "50%",
      border: `2px solid var(--tenant-primary-tint)`,
      borderTopColor: "var(--tenant-primary)",
      animation: "ids-spin 0.7s linear infinite",
      boxSizing: "border-box"
    }
  }), /*#__PURE__*/React.createElement("style", null, `@keyframes ids-spin{to{transform:rotate(360deg)}}`));
}
Object.assign(__ds_scope, { Spinner });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Spinner.jsx", error: String((e && e.message) || e) }); }

// components/forms/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const pad = {
  sm: "6px 12px",
  md: "9px 16px",
  lg: "12px 20px"
};
const fs = {
  sm: "13px",
  md: "14px",
  lg: "16px"
};
function Button({
  variant = "primary",
  size = "md",
  disabled,
  icon,
  children,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  const kinds = {
    primary: {
      background: press ? "var(--tenant-primary-deep)" : hover ? "var(--tenant-primary-deep)" : "var(--tenant-primary)",
      color: "var(--text-on-accent)",
      border: "1px solid transparent"
    },
    accent: {
      background: press || hover ? "var(--tenant-accent-deep)" : "var(--tenant-accent)",
      color: "var(--text-on-accent)",
      border: "1px solid transparent"
    },
    secondary: {
      background: hover ? "var(--tenant-primary-tint)" : "var(--surface-card)",
      color: "var(--tenant-primary-deep)",
      border: "1px solid var(--border-2)"
    },
    ghost: {
      background: hover ? "var(--tenant-primary-tint)" : "transparent",
      color: "var(--tenant-primary-deep)",
      border: "1px solid transparent"
    },
    danger: {
      background: press || hover ? "#A62F22" : "var(--danger)",
      color: "#fff",
      border: "1px solid transparent"
    }
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    disabled: disabled,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setPress(false);
    },
    onMouseDown: () => setPress(true),
    onMouseUp: () => setPress(false),
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      padding: pad[size],
      fontSize: fs[size],
      fontFamily: "var(--font-sans)",
      fontWeight: 500,
      borderRadius: "var(--radius-control)",
      cursor: disabled ? "default" : "pointer",
      opacity: disabled ? 0.45 : 1,
      transition: "background var(--duration-quick) var(--ease-quiet)",
      lineHeight: 1.3,
      whiteSpace: "nowrap",
      ...kinds[variant],
      ...style
    }
  }, rest), icon ? /*#__PURE__*/React.createElement("i", {
    className: `ti ti-${icon}`,
    style: {
      fontSize: "1.2em",
      lineHeight: 1
    }
  }) : null, children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Button.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function Checkbox({
  label,
  checked,
  defaultChecked,
  disabled,
  onChange
}) {
  const [on, setOn] = React.useState(!!defaultChecked);
  const isOn = checked !== undefined ? checked : on;
  const toggle = () => {
    if (disabled) return;
    if (checked === undefined) setOn(!isOn);
    onChange && onChange(!isOn);
  };
  return /*#__PURE__*/React.createElement("label", {
    onClick: toggle,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      cursor: disabled ? "default" : "pointer",
      opacity: disabled ? 0.45 : 1,
      fontSize: 14,
      fontFamily: "var(--font-sans)",
      color: "var(--text-1)",
      userSelect: "none"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 18,
      height: 18,
      flex: "none",
      borderRadius: 5,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      border: `1px solid ${isOn ? "var(--tenant-primary)" : "var(--border-2)"}`,
      background: isOn ? "var(--tenant-primary)" : "var(--surface-card)",
      transition: "background var(--duration-quick) var(--ease-quiet)"
    }
  }, isOn ? /*#__PURE__*/React.createElement("i", {
    className: "ti ti-check",
    style: {
      color: "#fff",
      fontSize: 13
    }
  }) : null), label);
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Field.jsx
try { (() => {
function Field({
  label,
  help,
  error,
  required,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
      fontFamily: "var(--font-sans)"
    }
  }, label ? /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      color: "var(--text-1)"
    }
  }, label, required ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--danger)"
    }
  }, " *") : null) : null, children, error ? /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 13,
      color: "var(--danger)",
      lineHeight: 1.45
    }
  }, error) : help ? /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 13,
      color: "var(--text-2)",
      lineHeight: 1.45
    }
  }, help) : null);
}
Object.assign(__ds_scope, { Field });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Field.jsx", error: String((e && e.message) || e) }); }

// components/forms/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function IconButton({
  icon,
  label,
  size = "md",
  variant = "quiet",
  disabled,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const dim = {
    sm: 28,
    md: 34,
    lg: 40
  }[size];
  const kinds = {
    quiet: {
      background: hover ? "var(--tenant-primary-tint)" : "transparent",
      color: "var(--text-2)",
      border: "1px solid transparent"
    },
    outline: {
      background: hover ? "var(--tenant-primary-tint)" : "var(--surface-card)",
      color: "var(--text-2)",
      border: "1px solid var(--border-2)"
    },
    solid: {
      background: hover ? "var(--tenant-primary-deep)" : "var(--tenant-primary)",
      color: "#fff",
      border: "1px solid transparent"
    }
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    "aria-label": label,
    title: label,
    disabled: disabled,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      width: dim,
      height: dim,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "var(--radius-control)",
      cursor: disabled ? "default" : "pointer",
      opacity: disabled ? 0.45 : 1,
      transition: "background var(--duration-quick) var(--ease-quiet)",
      ...kinds[variant],
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("i", {
    className: `ti ti-${icon}`,
    style: {
      fontSize: dim * 0.55
    }
  }));
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Input({
  size = "md",
  invalid,
  icon,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const pad = {
    sm: "6px 10px",
    md: "9px 12px",
    lg: "12px 14px"
  }[size];
  const box = {
    width: "100%",
    boxSizing: "border-box",
    padding: pad,
    paddingLeft: icon ? 36 : undefined,
    fontSize: size === "sm" ? 13 : size === "lg" ? 16 : 14,
    fontFamily: "var(--font-sans)",
    color: "var(--text-1)",
    background: "var(--surface-card)",
    borderRadius: "var(--radius-control)",
    border: `1px solid ${invalid ? "var(--danger)" : focus ? "var(--tenant-primary)" : "var(--border-2)"}`,
    boxShadow: focus ? `0 0 0 2px ${invalid ? "var(--danger-tint)" : "var(--tenant-primary-tint)"}` : "none",
    outline: "none",
    transition: "border-color var(--duration-quick) var(--ease-quiet)",
    lineHeight: 1.4
  };
  const input = /*#__PURE__*/React.createElement("input", _extends({
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      ...box,
      ...style
    }
  }, rest));
  if (!icon) return input;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      position: "relative",
      display: "block",
      width: "100%"
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: `ti ti-${icon}`,
    style: {
      position: "absolute",
      left: 11,
      top: "50%",
      transform: "translateY(-50%)",
      color: "var(--text-3)",
      fontSize: 17,
      pointerEvents: "none"
    }
  }), input);
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Radio.jsx
try { (() => {
function Radio({
  label,
  checked,
  disabled,
  onChange,
  name
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      cursor: disabled ? "default" : "pointer",
      opacity: disabled ? 0.45 : 1,
      fontSize: 14,
      fontFamily: "var(--font-sans)",
      color: "var(--text-1)",
      userSelect: "none"
    },
    onClick: () => !disabled && onChange && onChange()
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 18,
      height: 18,
      flex: "none",
      borderRadius: "50%",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      border: `1px solid ${checked ? "var(--tenant-primary)" : "var(--border-2)"}`,
      background: "var(--surface-card)"
    }
  }, checked ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: 10,
      height: 10,
      borderRadius: "50%",
      background: "var(--tenant-primary)"
    }
  }) : null), label);
}
Object.assign(__ds_scope, { Radio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Radio.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Select({
  size = "md",
  invalid,
  children,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const pad = {
    sm: "6px 10px",
    md: "9px 12px",
    lg: "12px 14px"
  }[size];
  return /*#__PURE__*/React.createElement("span", {
    style: {
      position: "relative",
      display: "block",
      width: "100%"
    }
  }, /*#__PURE__*/React.createElement("select", _extends({
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      width: "100%",
      boxSizing: "border-box",
      padding: pad,
      paddingRight: 32,
      appearance: "none",
      WebkitAppearance: "none",
      fontSize: size === "sm" ? 13 : size === "lg" ? 16 : 14,
      fontFamily: "var(--font-sans)",
      color: "var(--text-1)",
      background: "var(--surface-card)",
      borderRadius: "var(--radius-control)",
      border: `1px solid ${invalid ? "var(--danger)" : focus ? "var(--tenant-primary)" : "var(--border-2)"}`,
      boxShadow: focus ? "0 0 0 2px var(--tenant-primary-tint)" : "none",
      outline: "none",
      lineHeight: 1.4,
      cursor: "pointer",
      ...style
    }
  }, rest), children), /*#__PURE__*/React.createElement("i", {
    className: "ti ti-chevron-down",
    style: {
      position: "absolute",
      right: 10,
      top: "50%",
      transform: "translateY(-50%)",
      color: "var(--text-3)",
      fontSize: 15,
      pointerEvents: "none"
    }
  }));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function Switch({
  label,
  checked,
  defaultChecked,
  disabled,
  onChange
}) {
  const [on, setOn] = React.useState(!!defaultChecked);
  const isOn = checked !== undefined ? checked : on;
  const toggle = () => {
    if (disabled) return;
    if (checked === undefined) setOn(!isOn);
    onChange && onChange(!isOn);
  };
  return /*#__PURE__*/React.createElement("label", {
    onClick: toggle,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      cursor: disabled ? "default" : "pointer",
      opacity: disabled ? 0.45 : 1,
      fontSize: 14,
      fontFamily: "var(--font-sans)",
      color: "var(--text-1)",
      userSelect: "none"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 36,
      height: 21,
      flex: "none",
      borderRadius: 999,
      padding: 2,
      boxSizing: "border-box",
      background: isOn ? "var(--tenant-primary)" : "var(--border-2)",
      transition: "background var(--duration-base) var(--ease-quiet)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      width: 17,
      height: 17,
      borderRadius: "50%",
      background: "#fff",
      transform: isOn ? "translateX(15px)" : "none",
      transition: "transform var(--duration-base) var(--ease-quiet)"
    }
  })), label);
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/overlay/Drawer.jsx
try { (() => {
function Drawer({
  open,
  title,
  onClose,
  width = 380,
  footer,
  children
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(12,27,34,0.4)",
      zIndex: 100
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    role: "dialog",
    style: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      width,
      maxWidth: "92%",
      background: "var(--surface-popover)",
      boxShadow: "var(--shadow-overlay)",
      fontFamily: "var(--font-sans)",
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "16px 20px",
      borderBottom: "1px solid var(--border-1)"
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: 18,
      fontWeight: 500,
      color: "var(--text-1)",
      flex: 1
    }
  }, title), /*#__PURE__*/React.createElement("button", {
    "aria-label": "Close",
    onClick: onClose,
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "var(--text-3)",
      padding: 4
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ti ti-x",
    style: {
      fontSize: 18
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: "auto",
      padding: 20,
      fontSize: 14,
      color: "var(--text-2)",
      lineHeight: 1.55
    }
  }, children), footer ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      gap: 8,
      padding: 16,
      borderTop: "1px solid var(--border-1)"
    }
  }, footer) : null));
}
Object.assign(__ds_scope, { Drawer });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/overlay/Drawer.jsx", error: String((e && e.message) || e) }); }

// components/overlay/Modal.jsx
try { (() => {
function Modal({
  open,
  title,
  onClose,
  footer,
  width = 480,
  children
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(12,27,34,0.4)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 100,
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    role: "dialog",
    "aria-label": typeof title === "string" ? title : undefined,
    style: {
      width,
      maxWidth: "100%",
      background: "var(--surface-popover)",
      borderRadius: "var(--radius-card)",
      boxShadow: "var(--shadow-overlay)",
      fontFamily: "var(--font-sans)",
      display: "flex",
      flexDirection: "column",
      maxHeight: "90vh"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "16px 20px 0"
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: 18,
      fontWeight: 500,
      color: "var(--text-1)",
      flex: 1
    }
  }, title), /*#__PURE__*/React.createElement("button", {
    "aria-label": "Close",
    onClick: onClose,
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "var(--text-3)",
      padding: 4
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ti ti-x",
    style: {
      fontSize: 18
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "12px 20px 20px",
      overflowY: "auto",
      fontSize: 14,
      color: "var(--text-2)",
      lineHeight: 1.55
    }
  }, children), footer ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      gap: 8,
      padding: "0 20px 20px"
    }
  }, footer) : null));
}
Object.assign(__ds_scope, { Modal });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/overlay/Modal.jsx", error: String((e && e.message) || e) }); }

// components/overlay/Tabs.jsx
try { (() => {
function Tabs({
  tabs = [],
  value,
  defaultValue,
  onChange,
  style
}) {
  const [inner, setInner] = React.useState(defaultValue ?? (tabs[0] && tabs[0].value));
  const active = value !== undefined ? value : inner;
  const pick = v => {
    if (value === undefined) setInner(v);
    onChange && onChange(v);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 4,
      borderBottom: "1px solid var(--border-1)",
      fontFamily: "var(--font-sans)",
      ...style
    }
  }, tabs.map(t => {
    const on = t.value === active;
    return /*#__PURE__*/React.createElement("button", {
      key: t.value,
      onClick: () => pick(t.value),
      style: {
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "10px 14px",
        fontSize: 14,
        fontFamily: "inherit",
        fontWeight: on ? 500 : 400,
        color: on ? "var(--tenant-primary-deep)" : "var(--text-2)",
        boxShadow: on ? "inset 0 -2px 0 var(--tenant-primary)" : "none",
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        transition: "color var(--duration-quick) var(--ease-quiet)"
      }
    }, t.icon ? /*#__PURE__*/React.createElement("i", {
      className: `ti ti-${t.icon}`,
      style: {
        fontSize: 16
      }
    }) : null, t.label, t.count !== undefined ? /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 500,
        padding: "1px 7px",
        borderRadius: 999,
        background: on ? "var(--tenant-primary-tint)" : "var(--surface-sunken)",
        color: on ? "var(--tenant-primary-deep)" : "var(--text-3)"
      }
    }, t.count) : null);
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/overlay/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/overlay/Toast.jsx
try { (() => {
const icons = {
  success: "circle-check",
  warning: "alert-triangle",
  danger: "circle-x",
  info: "info-circle"
};
const colors = {
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--danger)",
  info: "var(--info)"
};
function Toast({
  tone = "info",
  title,
  action,
  onAction,
  onClose,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "12px 14px",
      background: "var(--surface-popover)",
      border: "1px solid var(--border-1)",
      borderRadius: "var(--radius-card)",
      boxShadow: "var(--shadow-float)",
      fontFamily: "var(--font-sans)",
      fontSize: 14,
      color: "var(--text-1)",
      maxWidth: 420,
      ...style
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: `ti ti-${icons[tone]}`,
    style: {
      color: colors[tone],
      fontSize: 20,
      flex: "none"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      lineHeight: 1.45
    }
  }, title), action ? /*#__PURE__*/React.createElement("button", {
    onClick: onAction,
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "var(--tenant-primary)",
      fontWeight: 500,
      fontSize: 13,
      fontFamily: "inherit",
      whiteSpace: "nowrap"
    }
  }, action) : null, onClose ? /*#__PURE__*/React.createElement("button", {
    "aria-label": "Dismiss",
    onClick: onClose,
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "var(--text-3)",
      padding: 2
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ti ti-x",
    style: {
      fontSize: 15
    }
  })) : null);
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/overlay/Toast.jsx", error: String((e && e.message) || e) }); }

// ui_kits/insurimple_app/AppShell.jsx
try { (() => {
const NAV = [{
  icon: "layout-dashboard",
  label: "Dashboard",
  key: "dashboard"
}, {
  icon: "users",
  label: "Contacts",
  key: "contacts"
}, {
  icon: "inbox",
  label: "Leads",
  key: "leads"
}, {
  icon: "columns-3",
  label: "Pipeline",
  key: "pipeline"
}, {
  icon: "file-invoice",
  label: "Transactions",
  key: "transactions"
}, {
  icon: "phone",
  label: "Calls",
  key: "calls"
}, {
  icon: "send",
  label: "Growth",
  key: "growth"
}, {
  icon: "chart-bar",
  label: "Reports",
  key: "reports"
}, {
  icon: "settings",
  label: "Settings",
  key: "settings"
}];
function AppShell({
  screen,
  onNav,
  theme,
  onTheme,
  children,
  onCall,
  onSearch,
  onBell
}) {
  const tenantLabel = {
    "": "insurimple",
    klc: "KLC Group",
    northpeak: "NorthPeak"
  }[theme];
  return /*#__PURE__*/React.createElement("div", {
    "data-theme": theme || undefined,
    style: {
      display: "flex",
      height: "100vh",
      background: "var(--surface-app)",
      fontFamily: "var(--font-sans)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("aside", {
    style: {
      width: 216,
      flex: "none",
      background: "var(--surface-card)",
      borderRight: "1px solid var(--border-1)",
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "18px 16px 14px",
      fontSize: 19,
      fontWeight: 500,
      letterSpacing: "-0.03em",
      color: "var(--text-1)"
    }
  }, theme === "" ? "insurimple" : tenantLabel, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      fontSize: 11,
      fontWeight: 400,
      letterSpacing: 0,
      color: "var(--text-3)",
      marginTop: 2
    }
  }, theme === "" ? "" : "powered by insurimple")), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 2,
      padding: "0 8px"
    }
  }, NAV.map(n => {
    const on = screen === n.key || n.key === "contacts" && screen === "contact";
    return /*#__PURE__*/React.createElement("a", {
      key: n.key,
      onClick: () => onNav(n.key),
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 10px",
        borderRadius: 8,
        cursor: "pointer",
        textDecoration: "none",
        fontSize: 14,
        fontWeight: on ? 500 : 400,
        color: on ? "var(--tenant-primary-deep)" : "var(--text-2)",
        background: on ? "var(--tenant-primary-tint)" : "transparent"
      }
    }, /*#__PURE__*/React.createElement("i", {
      className: `ti ti-${n.icon}`,
      style: {
        fontSize: 18
      }
    }), n.label);
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "auto",
      padding: 12,
      borderTop: "1px solid var(--border-1)",
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Gautam Khosla",
    size: "sm"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500,
      color: "var(--text-1)"
    }
  }, "Gautam Khosla"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "var(--text-3)",
      fontSize: 11
    }
  }, "Life producer \xB7 LLQP")))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      height: 56,
      flex: "none",
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "0 20px",
      background: "var(--surface-card)",
      borderBottom: "1px solid var(--border-1)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 320
    },
    onClick: onSearch
  }, /*#__PURE__*/React.createElement(Input, {
    icon: "search",
    size: "sm",
    placeholder: "Search or type a command\u2026  \u2318K",
    readOnly: true,
    style: {
      cursor: "pointer"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: "auto",
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, "Tenant theme"), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 150
    }
  }, /*#__PURE__*/React.createElement(Select, {
    size: "sm",
    value: theme,
    onChange: e => onTheme(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Insurimple"), /*#__PURE__*/React.createElement("option", {
    value: "klc"
  }, "KLC Group"), /*#__PURE__*/React.createElement("option", {
    value: "northpeak"
  }, "NorthPeak"))), /*#__PURE__*/React.createElement(IconButton, {
    icon: "phone-incoming",
    label: "Simulate incoming call",
    variant: "outline",
    onClick: onCall
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: "bell",
    label: "Notifications",
    onClick: onBell
  }))), /*#__PURE__*/React.createElement("main", {
    style: {
      flex: 1,
      overflowY: "auto"
    }
  }, children)));
}
window.AppShell = AppShell;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/insurimple_app/AppShell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/insurimple_app/Bms.jsx
try { (() => {
const POLICIES = [{
  id: "POL-2041",
  client: "Priya Sharma",
  product: "Term life · $500k · 20y",
  carrier: "Maple Mutual",
  status: "Active",
  tone: "success",
  premium: "$54.20/mo",
  renewal: "Mar 2041"
}, {
  id: "POL-8812",
  client: "Rosa Martinez",
  product: "Personal auto · 2 drivers",
  carrier: "True North P&C",
  status: "Active",
  tone: "success",
  premium: "$168.90/mo",
  renewal: "Nov 2026"
}, {
  id: "POL-8813",
  client: "Rosa Martinez",
  product: "Homeowners · HO-3",
  carrier: "True North P&C",
  status: "Active",
  tone: "success",
  premium: "$96.40/mo",
  renewal: "Nov 2026"
}, {
  id: "POL-1930",
  client: "Wei Chen",
  product: "Whole life · $250k",
  carrier: "Laurentide",
  status: "Renewal due",
  tone: "warning",
  premium: "$112.75/mo",
  renewal: "Aug 2026"
}, {
  id: "POL-1101",
  client: "Jean Tremblay",
  product: "Super Visa medical · $100k",
  carrier: "Pacific & Prairie",
  status: "Active",
  tone: "success",
  premium: "$168.00/mo",
  renewal: "Jan 2027"
}, {
  id: "POL-0788",
  client: "Ted Kowalski",
  product: "Commercial GL · retail",
  carrier: "True North P&C",
  status: "Lapsed",
  tone: "danger",
  premium: "$385.00/mo",
  renewal: "—"
}];
function PoliciesList({
  onOpen,
  onNew,
  embedded
}) {
  const [q, setQ] = React.useState("");
  const rows = POLICIES.filter(p => !q || (p.client + p.id).toLowerCase().includes(q.toLowerCase()));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: embedded ? 0 : 24,
      display: "flex",
      flexDirection: "column",
      gap: 14,
      maxWidth: 1100
    }
  }, !embedded ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontSize: 22,
      fontWeight: 500,
      color: "var(--text-1)"
    }
  }, "Policies"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--text-3)"
    }
  }, POLICIES.length, " in book"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    icon: "plus",
    onClick: onNew
  }, "New transaction"))) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 240
    }
  }, /*#__PURE__*/React.createElement(Input, {
    size: "sm",
    icon: "search",
    placeholder: "Search client or policy #",
    value: q,
    onChange: e => setQ(e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 130
    }
  }, /*#__PURE__*/React.createElement(Select, {
    size: "sm",
    defaultValue: "all"
  }, /*#__PURE__*/React.createElement("option", {
    value: "all"
  }, "All lines"), /*#__PURE__*/React.createElement("option", null, "Life"), /*#__PURE__*/React.createElement("option", null, "A&S / travel"), /*#__PURE__*/React.createElement("option", null, "Auto"), /*#__PURE__*/React.createElement("option", null, "Property"), /*#__PURE__*/React.createElement("option", null, "Commercial"))), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 130
    }
  }, /*#__PURE__*/React.createElement(Select, {
    size: "sm",
    defaultValue: "all"
  }, /*#__PURE__*/React.createElement("option", {
    value: "all"
  }, "All statuses"), /*#__PURE__*/React.createElement("option", null, "Active"), /*#__PURE__*/React.createElement("option", null, "Renewal due"), /*#__PURE__*/React.createElement("option", null, "Lapsed"))), embedded ? /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "sm",
    icon: "plus",
    onClick: onNew
  }, "New transaction")) : null), /*#__PURE__*/React.createElement(Table, {
    columns: [{
      header: "Policy",
      render: r => /*#__PURE__*/React.createElement("span", {
        style: {
          fontWeight: 500
        }
      }, r.id)
    }, {
      header: "Client",
      key: "client"
    }, {
      header: "Product",
      key: "product"
    }, {
      header: "Carrier",
      key: "carrier"
    }, {
      header: "Status",
      render: r => /*#__PURE__*/React.createElement(Badge, {
        tone: r.tone,
        dot: true
      }, r.status)
    }, {
      header: "Premium",
      key: "premium",
      align: "right"
    }, {
      header: "Renewal",
      key: "renewal",
      align: "right"
    }],
    rows: rows,
    onRowClick: () => onOpen()
  }));
}
function PolicyRecord({
  onBack,
  onOpenTransaction
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24,
      display: "flex",
      flexDirection: "column",
      gap: 16,
      maxWidth: 1100
    }
  }, /*#__PURE__*/React.createElement("a", {
    onClick: onBack,
    style: {
      fontSize: 13,
      color: "var(--text-3)",
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ti ti-arrow-left"
  }), "Policies"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontSize: 22,
      fontWeight: 500,
      color: "var(--text-1)"
    }
  }, "POL-8812 \u2014 Personal auto"), /*#__PURE__*/React.createElement(Badge, {
    tone: "success",
    dot: true
  }, "Active")), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "3px 0 0",
      fontSize: 13,
      color: "var(--text-2)"
    }
  }, "Rosa Martinez \xB7 True North P&C \xB7 Effective Nov 12, 2025 \u2192 Nov 12, 2026 \xB7 $168.90/mo")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: "auto",
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    icon: "file-download"
  }, "Documents"), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    icon: "file-pencil",
    onClick: onOpenTransaction
  }, "Start endorsement"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1.6fr 1fr",
      gap: 12,
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: 16,
      fontWeight: 500,
      color: "var(--text-1)"
    }
  }, "Coverages"), /*#__PURE__*/React.createElement(Table, {
    columns: [{
      header: "Coverage",
      key: "cov"
    }, {
      header: "Limit / deductible",
      key: "limit"
    }, {
      header: "Premium",
      key: "prem",
      align: "right"
    }],
    rows: [{
      cov: "Third-party liability",
      limit: "$2,000,000",
      prem: "$62.10/mo"
    }, {
      cov: "Collision",
      limit: "$1,000 deductible",
      prem: "$48.30/mo"
    }, {
      cov: "Comprehensive",
      limit: "$500 deductible",
      prem: "$31.20/mo"
    }, {
      cov: "Accident benefits (standard)",
      limit: "Ontario standard",
      prem: "$27.30/mo"
    }]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-1)",
      borderRadius: 12,
      padding: 16,
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 500,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: "var(--text-3)"
    }
  }, "Ontario auto elections"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      fontSize: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("span", null, "Direct compensation deductible"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 500
    }
  }, "$0 (declined buy-down)")), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("span", null, "Income replacement top-up"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 500
    }
  }, "Declined \u2014 signed Nov 2025")), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("span", null, "OPCF 20 (loss of use)"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 500
    }
  }, "Included"))), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, "Election forms on file \xB7 last confirmed at renewal"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: 16,
      fontWeight: 500,
      color: "var(--text-1)"
    }
  }, "History"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-1)",
      borderRadius: 12,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement(ListRow, {
    leading: /*#__PURE__*/React.createElement("i", {
      className: "ti ti-file-pencil",
      style: {
        color: "var(--tenant-primary)",
        fontSize: 17
      }
    }),
    title: "Endorsement \u2014 added driver",
    subtitle: "TXN-201 \xB7 completed",
    meta: "May 3",
    onClick: onOpenTransaction
  }), /*#__PURE__*/React.createElement(ListRow, {
    leading: /*#__PURE__*/React.createElement("i", {
      className: "ti ti-refresh",
      style: {
        color: "var(--tenant-primary)",
        fontSize: 17
      }
    }),
    title: "Renewal processed",
    subtitle: "Premium +$4.20/mo",
    meta: "Nov 2025"
  }), /*#__PURE__*/React.createElement(ListRow, {
    leading: /*#__PURE__*/React.createElement("i", {
      className: "ti ti-file-plus",
      style: {
        color: "var(--tenant-primary)",
        fontSize: 17
      }
    }),
    title: "New business bound",
    subtitle: "TXN-118 \xB7 completed",
    meta: "Nov 2024",
    style: {
      borderBottom: "none"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--tenant-primary-tint)",
      borderRadius: 12,
      padding: 14,
      fontSize: 13,
      color: "var(--text-1)",
      display: "flex",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ti ti-calendar-due",
    style: {
      fontSize: 18,
      color: "var(--tenant-primary)",
      flex: "none"
    }
  }), /*#__PURE__*/React.createElement("span", null, "Renews Nov 12, 2026. Review opens 60 days before \u2014 Sept 13.")))));
}
const TXN_STATES = ["Draft", "Submitted", "Underwriting", "Approved", "Issued", "Completed"];
function TransactionRecord({
  onBack,
  onDocs
}) {
  const [state, setState] = React.useState(2);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24,
      display: "flex",
      flexDirection: "column",
      gap: 16,
      maxWidth: 1100
    }
  }, /*#__PURE__*/React.createElement("a", {
    onClick: onBack,
    style: {
      fontSize: 13,
      color: "var(--text-3)",
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ti ti-arrow-left"
  }), "Back"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontSize: 22,
      fontWeight: 500,
      color: "var(--text-1)"
    }
  }, "TXN-118 \u2014 New business"), /*#__PURE__*/React.createElement(Badge, {
    tone: "info",
    dot: true
  }, TXN_STATES[state])), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "3px 0 0",
      fontSize: 13,
      color: "var(--text-2)"
    }
  }, "Priya Sharma \xB7 Critical illness \xB7 $100k \xB7 Maple Mutual \xB7 opened July 2 by GK")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: "auto",
      display: "flex",
      gap: 8
    }
  }, state > 0 ? /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    onClick: () => setState(state - 1)
  }, "Step back") : null, state < TXN_STATES.length - 1 ? /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    icon: "arrow-right",
    onClick: () => setState(state + 1)
  }, "Advance to ", TXN_STATES[state + 1]) : /*#__PURE__*/React.createElement(Badge, {
    tone: "success",
    dot: true
  }, "Done"))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-1)",
      borderRadius: 12,
      padding: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center"
    }
  }, TXN_STATES.map((s, i) => {
    const st = i < state ? "done" : i === state ? "current" : "todo";
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: s
    }, i > 0 ? /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        height: 2,
        background: st === "todo" ? "var(--border-1)" : "var(--tenant-primary)"
      }
    }) : null, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 5,
        width: 96,
        flex: "none"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 24,
        height: 24,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        background: st === "todo" ? "var(--surface-sunken)" : st === "current" ? "var(--tenant-primary-tint)" : "var(--tenant-primary)",
        border: st === "current" ? "2px solid var(--tenant-primary)" : "2px solid transparent",
        boxSizing: "border-box",
        color: st === "done" ? "#fff" : st === "current" ? "var(--tenant-primary-deep)" : "var(--text-3)"
      }
    }, st === "done" ? /*#__PURE__*/React.createElement("i", {
      className: "ti ti-check"
    }) : i + 1), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: st === "todo" ? "var(--text-3)" : "var(--text-1)",
        fontWeight: st === "current" ? 500 : 400
      }
    }, s)));
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1.6fr 1fr",
      gap: 12,
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: 16,
      fontWeight: 500,
      color: "var(--text-1)"
    }
  }, "What's needed now"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-1)",
      borderRadius: 12,
      padding: "6px 16px",
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "10px 0",
      borderBottom: "1px solid var(--border-1)"
    }
  }, /*#__PURE__*/React.createElement(Checkbox, {
    label: "Paramedical exam booked (before July 20)",
    defaultChecked: true
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "10px 0",
      borderBottom: "1px solid var(--border-1)"
    }
  }, /*#__PURE__*/React.createElement(Checkbox, {
    label: "Attending physician statement requested"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "10px 0"
    }
  }, /*#__PURE__*/React.createElement(Checkbox, {
    label: "Carrier questionnaire \u2014 travel history"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-1)",
      borderRadius: 12,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement(ListRow, {
    leading: /*#__PURE__*/React.createElement("i", {
      className: "ti ti-file-text",
      style: {
        color: "var(--tenant-primary)",
        fontSize: 17
      }
    }),
    title: "Application PDF",
    subtitle: "Generated July 2 \xB7 signed",
    meta: "View",
    trailing: /*#__PURE__*/React.createElement(Badge, {
      tone: "success",
      dot: true
    }, "Signed"),
    onClick: onDocs
  }), /*#__PURE__*/React.createElement(ListRow, {
    leading: /*#__PURE__*/React.createElement("i", {
      className: "ti ti-signature",
      style: {
        color: "var(--tenant-primary)",
        fontSize: 17
      }
    }),
    title: "Consent & disclosures",
    subtitle: "E-signature \xB7 completed July 2",
    meta: "View",
    trailing: /*#__PURE__*/React.createElement(Badge, {
      tone: "success",
      dot: true
    }, "Signed"),
    onClick: onDocs,
    style: {
      borderBottom: "none"
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: 16,
      fontWeight: 500,
      color: "var(--text-1)"
    }
  }, "Timeline"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-1)",
      borderRadius: 12,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement(ListRow, {
    leading: /*#__PURE__*/React.createElement("i", {
      className: "ti ti-arrow-up-right",
      style: {
        color: "var(--tenant-primary)",
        fontSize: 17
      }
    }),
    title: "Submitted to Maple Mutual",
    subtitle: "via carrier portal",
    meta: "July 5"
  }), /*#__PURE__*/React.createElement(ListRow, {
    leading: /*#__PURE__*/React.createElement("i", {
      className: "ti ti-signature",
      style: {
        color: "var(--tenant-primary)",
        fontSize: 17
      }
    }),
    title: "Client signed application",
    meta: "July 2"
  }), /*#__PURE__*/React.createElement(ListRow, {
    leading: /*#__PURE__*/React.createElement("i", {
      className: "ti ti-file-plus",
      style: {
        color: "var(--tenant-primary)",
        fontSize: 17
      }
    }),
    title: "Transaction opened",
    subtitle: "by Gautam K.",
    meta: "July 2",
    style: {
      borderBottom: "none"
    }
  })))));
}
function NewTransactionModal({
  open,
  onClose,
  onCreated
}) {
  const [type, setType] = React.useState("new");
  const types = [["new", "New business", "file-plus"], ["endorse", "Endorsement", "file-pencil"], ["renew", "Renewal", "refresh"], ["cancel", "Cancellation", "file-x"]];
  return /*#__PURE__*/React.createElement(Modal, {
    open: open,
    title: "New transaction",
    onClose: onClose,
    width: 520,
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      onClick: onClose
    }, "Cancel"), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      icon: "arrow-right",
      onClick: onCreated
    }, "Create draft"))
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Type"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 8,
      paddingTop: 4
    }
  }, types.map(([k, label, icon]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    onClick: () => setType(k),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "10px 12px",
      borderRadius: 8,
      cursor: "pointer",
      border: `1px solid ${type === k ? "var(--tenant-primary)" : "var(--border-2)"}`,
      background: type === k ? "var(--tenant-primary-tint)" : "var(--surface-card)",
      color: type === k ? "var(--tenant-primary-deep)" : "var(--text-2)",
      fontSize: 14,
      fontWeight: type === k ? 500 : 400
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: `ti ti-${icon}`,
    style: {
      fontSize: 18
    }
  }), label)))), /*#__PURE__*/React.createElement(Field, {
    label: "Client",
    required: true
  }, /*#__PURE__*/React.createElement(Select, {
    defaultValue: ""
  }, /*#__PURE__*/React.createElement("option", {
    value: "",
    disabled: true
  }, "Pick a client\u2026"), /*#__PURE__*/React.createElement("option", null, "Priya Sharma"), /*#__PURE__*/React.createElement("option", null, "Rosa Martinez"), /*#__PURE__*/React.createElement("option", null, "Wei Chen"), /*#__PURE__*/React.createElement("option", null, "Jean Tremblay"))), /*#__PURE__*/React.createElement(Field, {
    label: type === "new" ? "Product line" : "Policy",
    required: true
  }, type === "new" ? /*#__PURE__*/React.createElement(Select, {
    defaultValue: ""
  }, /*#__PURE__*/React.createElement("option", {
    value: "",
    disabled: true
  }, "Pick a line\u2026"), /*#__PURE__*/React.createElement("option", null, "Term life"), /*#__PURE__*/React.createElement("option", null, "Whole life"), /*#__PURE__*/React.createElement("option", null, "Critical illness"), /*#__PURE__*/React.createElement("option", null, "Super Visa medical"), /*#__PURE__*/React.createElement("option", null, "Personal auto"), /*#__PURE__*/React.createElement("option", null, "Homeowners")) : /*#__PURE__*/React.createElement(Select, {
    defaultValue: ""
  }, /*#__PURE__*/React.createElement("option", {
    value: "",
    disabled: true
  }, "Pick a policy\u2026"), /*#__PURE__*/React.createElement("option", null, "POL-8812 \u2014 Personal auto"), /*#__PURE__*/React.createElement("option", null, "POL-8813 \u2014 Homeowners"))), /*#__PURE__*/React.createElement(Field, {
    label: "Effective date"
  }, /*#__PURE__*/React.createElement(Input, {
    icon: "calendar",
    placeholder: "2026-07-15"
  }))));
}
Object.assign(window, {
  PoliciesList,
  PolicyRecord,
  TransactionRecord,
  NewTransactionModal
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/insurimple_app/Bms.jsx", error: String((e && e.message) || e) }); }

// ui_kits/insurimple_app/Bms2.jsx
try { (() => {
const TXNS = [{
  id: "TXN-118",
  client: "Priya Sharma",
  type: "New business",
  detail: "Critical illness · $100k",
  state: "Underwriting",
  tone: "info",
  owner: "GK",
  age: "11d"
}, {
  id: "TXN-201",
  client: "Rosa Martinez",
  type: "Endorsement",
  detail: "Add driver — POL-8812",
  state: "Completed",
  tone: "success",
  owner: "TK",
  age: "—"
}, {
  id: "TXN-204",
  client: "Wei Chen",
  type: "Renewal",
  detail: "Whole life — POL-1930",
  state: "Draft",
  tone: "neutral",
  owner: "GK",
  age: "2d"
}, {
  id: "TXN-205",
  client: "Ted Kowalski",
  type: "New business",
  detail: "Commercial GL · retail",
  state: "Submitted",
  tone: "info",
  owner: "TK",
  age: "5d"
}, {
  id: "TXN-199",
  client: "Jean Tremblay",
  type: "Cancellation",
  detail: "Trip cancelled — refund",
  state: "Rejected",
  tone: "danger",
  owner: "MN",
  age: "—"
}];
function TransactionsList({
  onOpen,
  onNew
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 240
    }
  }, /*#__PURE__*/React.createElement(Input, {
    size: "sm",
    icon: "search",
    placeholder: "Search client or TXN #"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 140
    }
  }, /*#__PURE__*/React.createElement(Select, {
    size: "sm",
    defaultValue: "all"
  }, /*#__PURE__*/React.createElement("option", {
    value: "all"
  }, "All types"), /*#__PURE__*/React.createElement("option", null, "New business"), /*#__PURE__*/React.createElement("option", null, "Endorsement"), /*#__PURE__*/React.createElement("option", null, "Renewal"), /*#__PURE__*/React.createElement("option", null, "Cancellation"))), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 140
    }
  }, /*#__PURE__*/React.createElement(Select, {
    size: "sm",
    defaultValue: "open"
  }, /*#__PURE__*/React.createElement("option", {
    value: "open"
  }, "Open only"), /*#__PURE__*/React.createElement("option", null, "All states"), /*#__PURE__*/React.createElement("option", null, "Completed"), /*#__PURE__*/React.createElement("option", null, "Rejected"))), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "sm",
    icon: "plus",
    onClick: onNew
  }, "New transaction"))), /*#__PURE__*/React.createElement(Table, {
    columns: [{
      header: "Transaction",
      render: r => /*#__PURE__*/React.createElement("span", {
        style: {
          fontWeight: 500
        }
      }, r.id)
    }, {
      header: "Client",
      key: "client"
    }, {
      header: "Type",
      key: "type"
    }, {
      header: "Detail",
      key: "detail"
    }, {
      header: "State",
      render: r => /*#__PURE__*/React.createElement(Badge, {
        tone: r.tone,
        dot: true
      }, r.state)
    }, {
      header: "Owner",
      render: r => /*#__PURE__*/React.createElement(Avatar, {
        name: r.owner,
        size: "sm"
      })
    }, {
      header: "In state",
      key: "age",
      align: "right"
    }],
    rows: TXNS,
    onRowClick: () => onOpen()
  }));
}
const RENEWALS = [{
  client: "Wei Chen",
  policy: "POL-1930 · Whole life",
  date: "Aug 3",
  days: 21,
  change: "+$6.10/mo",
  risk: "Talk to client",
  tone: "warning"
}, {
  client: "Marie Gagnon",
  policy: "POL-7241 · Homeowners",
  date: "Sept 3",
  days: 52,
  change: "+$2.30/mo",
  risk: "Auto-renew ok",
  tone: "success"
}, {
  client: "Rosa Martinez",
  policy: "POL-8812 · Personal auto",
  date: "Nov 12",
  days: 122,
  change: "TBD",
  risk: "Review at 60d",
  tone: "neutral"
}, {
  client: "Devon Clarke",
  policy: "POL-6120 · Personal auto",
  date: "Aug 21",
  days: 39,
  change: "+$18.40/mo",
  risk: "Shop the market",
  tone: "danger"
}];
function RenewalsTriage({
  onOpen
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12
    }
  }, [["21", "renew in 30 days"], ["42", "in 60 days"], ["3", "premium jump >10%"]].map(([n, l]) => /*#__PURE__*/React.createElement("div", {
    key: l,
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-1)",
      borderRadius: 12,
      padding: "10px 16px",
      display: "flex",
      alignItems: "baseline",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 22,
      fontWeight: 500,
      color: "var(--text-1)",
      fontVariantNumeric: "tabular-nums"
    }
  }, n), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--text-2)"
    }
  }, l))), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      alignSelf: "center",
      fontSize: 13,
      color: "var(--text-3)"
    }
  }, "Sorted by risk, then date")), /*#__PURE__*/React.createElement(Table, {
    columns: [{
      header: "Client",
      render: r => /*#__PURE__*/React.createElement("span", {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 8
        }
      }, /*#__PURE__*/React.createElement(Avatar, {
        name: r.client,
        size: "sm"
      }), /*#__PURE__*/React.createElement("span", {
        style: {
          fontWeight: 500
        }
      }, r.client))
    }, {
      header: "Policy",
      key: "policy"
    }, {
      header: "Renews",
      render: r => /*#__PURE__*/React.createElement("span", null, r.date, " ", /*#__PURE__*/React.createElement("span", {
        style: {
          color: "var(--text-3)",
          fontSize: 12
        }
      }, "(", r.days, "d)"))
    }, {
      header: "Premium change",
      key: "change",
      align: "right"
    }, {
      header: "Triage",
      render: r => /*#__PURE__*/React.createElement(Badge, {
        tone: r.tone,
        dot: true
      }, r.risk)
    }, {
      header: "",
      render: () => /*#__PURE__*/React.createElement(Button, {
        size: "sm",
        variant: "secondary"
      }, "Start renewal")
    }],
    rows: RENEWALS,
    onRowClick: () => onOpen()
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, "\"Shop the market\" flags a jump over 10% \u2014 the renewal email isn't sent until you've reviewed it."));
}
function BmsHome({
  tab,
  onTab,
  onOpenPolicy,
  onOpenTxn,
  onNew
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24,
      display: "flex",
      flexDirection: "column",
      gap: 14,
      maxWidth: 1100
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontSize: 22,
      fontWeight: 500,
      color: "var(--text-1)"
    }
  }, "Book of business")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-1)",
      borderRadius: 12,
      padding: "0 8px"
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    value: tab,
    onChange: onTab,
    tabs: [{
      value: "policies",
      label: "Policies",
      count: 6
    }, {
      value: "transactions",
      label: "Transactions",
      count: 3
    }, {
      value: "renewals",
      label: "Renewals",
      count: 21
    }]
  })), tab === "transactions" ? /*#__PURE__*/React.createElement(TransactionsList, {
    onOpen: onOpenTxn,
    onNew: onNew
  }) : tab === "renewals" ? /*#__PURE__*/React.createElement(RenewalsTriage, {
    onOpen: onOpenPolicy
  }) : /*#__PURE__*/React.createElement(PoliciesList, {
    embedded: true,
    onOpen: onOpenPolicy,
    onNew: onNew
  }));
}
Object.assign(window, {
  TransactionsList,
  RenewalsTriage,
  BmsHome
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/insurimple_app/Bms2.jsx", error: String((e && e.message) || e) }); }

// ui_kits/insurimple_app/ContactRecord.jsx
try { (() => {
function ContactRecord() {
  const [tab, setTab] = React.useState("overview");
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24,
      display: "flex",
      flexDirection: "column",
      gap: 16,
      maxWidth: 1100
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Priya Sharma",
    size: "lg"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontSize: 22,
      fontWeight: 500,
      color: "var(--text-1)"
    }
  }, "Priya Sharma"), /*#__PURE__*/React.createElement(Badge, {
    tone: "success",
    dot: true
  }, "Active client"), /*#__PURE__*/React.createElement(Badge, {
    tone: "accent"
  }, "Newcomer")), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "3px 0 0",
      fontSize: 13,
      color: "var(--text-2)"
    }
  }, "Toronto, ON \xB7 priya.s@example.ca \xB7 (416) 555-0182 \xB7 Client since 2024")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: "auto",
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    icon: "mail"
  }, "Email"), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    icon: "phone"
  }, "Call"))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-1)",
      borderRadius: 12,
      padding: "0 12px"
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    value: tab,
    onChange: setTab,
    tabs: [{
      value: "overview",
      label: "Overview",
      icon: "user"
    }, {
      value: "policies",
      label: "Policies",
      count: 2
    }, {
      value: "activity",
      label: "Activity",
      count: 12
    }, {
      value: "tasks",
      label: "Tasks",
      count: 1
    }, {
      value: "documents",
      label: "Documents"
    }]
  })), tab === "overview" || tab === "policies" ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1.6fr 1fr",
      gap: 12,
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: 16,
      fontWeight: 500,
      color: "var(--text-1)"
    }
  }, "Policies"), /*#__PURE__*/React.createElement(Table, {
    columns: [{
      header: "Policy",
      key: "id"
    }, {
      header: "Product",
      key: "product"
    }, {
      header: "Status",
      render: r => /*#__PURE__*/React.createElement(Badge, {
        tone: r.tone,
        dot: true
      }, r.status)
    }, {
      header: "Premium",
      key: "premium",
      align: "right"
    }],
    rows: [{
      id: "POL-2041",
      product: "Term life · $500k · 20y",
      status: "Active",
      tone: "success",
      premium: "$54.20/mo"
    }, {
      id: "TXN-118",
      product: "Critical illness · $100k",
      status: "Application",
      tone: "info",
      premium: "$38.90/mo"
    }],
    onRowClick: () => {}
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-1)",
      borderRadius: 12,
      padding: 16,
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 500,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: "var(--text-3)"
    }
  }, "Application TXN-118 \u2014 state"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 0
    }
  }, ["Draft", "Submitted", "Underwriting", "Approved", "Completed"].map((s, i) => {
    const state = i < 2 ? "done" : i === 2 ? "current" : "todo";
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: s
    }, i > 0 ? /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        height: 2,
        background: state === "todo" ? "var(--border-1)" : "var(--tenant-primary)"
      }
    }) : null, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 5,
        width: 86,
        flex: "none"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 22,
        height: 22,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        background: state === "todo" ? "var(--surface-sunken)" : state === "current" ? "var(--tenant-primary-tint)" : "var(--tenant-primary)",
        border: state === "current" ? "2px solid var(--tenant-primary)" : "2px solid transparent",
        boxSizing: "border-box",
        color: state === "done" ? "#fff" : state === "current" ? "var(--tenant-primary-deep)" : "var(--text-3)"
      }
    }, state === "done" ? /*#__PURE__*/React.createElement("i", {
      className: "ti ti-check"
    }) : i + 1), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: state === "todo" ? "var(--text-3)" : "var(--text-1)",
        fontWeight: state === "current" ? 500 : 400
      }
    }, s)));
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: 16,
      fontWeight: 500,
      color: "var(--text-1)"
    }
  }, "Activity"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-1)",
      borderRadius: 12,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement(ListRow, {
    leading: /*#__PURE__*/React.createElement("i", {
      className: "ti ti-phone-outgoing",
      style: {
        color: "var(--tenant-primary)",
        fontSize: 17
      }
    }),
    title: "Call \u2014 application follow-up",
    subtitle: "6 min \xB7 notes added",
    meta: "2h ago"
  }), /*#__PURE__*/React.createElement(ListRow, {
    leading: /*#__PURE__*/React.createElement("i", {
      className: "ti ti-mail",
      style: {
        color: "var(--tenant-primary)",
        fontSize: 17
      }
    }),
    title: "Quote sent \u2014 critical illness",
    subtitle: "Opened twice",
    meta: "1d ago"
  }), /*#__PURE__*/React.createElement(ListRow, {
    leading: /*#__PURE__*/React.createElement("i", {
      className: "ti ti-signature",
      style: {
        color: "var(--tenant-primary)",
        fontSize: 17
      }
    }),
    title: "Consent signed (CASL)",
    subtitle: "Via e-signature",
    meta: "Mar 12",
    style: {
      borderBottom: "none"
    }
  })), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: "8px 0 0",
      fontSize: 16,
      fontWeight: 500,
      color: "var(--text-1)"
    }
  }, "Tasks"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-1)",
      borderRadius: 12,
      padding: "6px 14px"
    }
  }, /*#__PURE__*/React.createElement(Checkbox, {
    label: "Book paramedical exam before July 20"
  })))) : /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-1)",
      borderRadius: 12
    }
  }, /*#__PURE__*/React.createElement(EmptyState, {
    icon: "clipboard-list",
    title: "Nothing here yet",
    body: "This tab is part of the full build \u2014 content wasn't specified in the brief, so it's left intentionally blank."
  })));
}
function CallPop({
  open,
  onClose,
  onOpenContact
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      right: 20,
      bottom: 20,
      zIndex: 200,
      width: 320,
      background: "var(--surface-popover)",
      borderRadius: 12,
      boxShadow: "var(--shadow-overlay)",
      border: "1px solid var(--border-1)",
      fontFamily: "var(--font-sans)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "10px 14px",
      background: "var(--tenant-primary)",
      color: "#fff",
      fontSize: 12,
      fontWeight: 500,
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ti ti-phone-incoming",
    style: {
      fontSize: 15
    }
  }), " Incoming call"), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 14,
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Priya Sharma",
    size: "lg"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 500,
      color: "var(--text-1)"
    }
  }, "Priya Sharma"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-2)"
    }
  }, "(416) 555-0182 \xB7 Active client"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, "Open application: TXN-118"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      padding: "0 14px 14px"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    icon: "phone",
    style: {
      flex: 1
    },
    onClick: onOpenContact
  }, "Answer & open record"), /*#__PURE__*/React.createElement(IconButton, {
    icon: "phone-off",
    label: "Decline",
    variant: "outline",
    onClick: onClose
  })));
}
Object.assign(window, {
  ContactRecord,
  CallPop
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/insurimple_app/ContactRecord.jsx", error: String((e && e.message) || e) }); }

// ui_kits/insurimple_app/Crm.jsx
try { (() => {
const CONTACTS = [{
  name: "Priya Sharma",
  email: "priya.s@example.ca",
  phone: "(416) 555-0182",
  city: "Toronto, ON",
  segments: ["Newcomer"],
  products: "Term life · CI (applying)",
  owner: "GK",
  last: "2h ago",
  status: "Active client",
  tone: "success"
}, {
  name: "Jean Tremblay",
  email: "j.tremblay@example.ca",
  phone: "(514) 555-0147",
  city: "Montréal, QC",
  segments: ["Super Visa"],
  products: "Super Visa medical",
  owner: "GK",
  last: "1d ago",
  status: "In review",
  tone: "info"
}, {
  name: "Wei Chen",
  email: "wei.chen@example.ca",
  phone: "(604) 555-0126",
  city: "Burnaby, BC",
  segments: [],
  products: "Whole life · $250k",
  owner: "MN",
  last: "3d ago",
  status: "Renewal due",
  tone: "warning"
}, {
  name: "Amara Okafor",
  email: "a.okafor@example.ca",
  phone: "(416) 555-0171",
  city: "Brampton, ON",
  segments: ["Newcomer"],
  products: "Term life · $750k",
  owner: "GK",
  last: "5d ago",
  status: "Underwriting",
  tone: "info"
}, {
  name: "Rosa Martinez",
  email: "rosa.m@example.ca",
  phone: "(905) 555-0192",
  city: "Hamilton, ON",
  segments: [],
  products: "Auto + home bundle",
  owner: "TK",
  last: "1w ago",
  status: "Quote sent",
  tone: "accent"
}, {
  name: "Fatima Al-Rashid",
  email: "f.alrashid@example.ca",
  phone: "(613) 555-0139",
  city: "Ottawa, ON",
  segments: ["Newcomer", "Super Visa"],
  products: "Visitor to Canada",
  owner: "MN",
  last: "2w ago",
  status: "Application",
  tone: "info"
}];
function ContactsList({
  onOpen,
  onAdd
}) {
  const [q, setQ] = React.useState("");
  const [seg, setSeg] = React.useState("");
  const rows = CONTACTS.filter(c => (!seg || c.segments.includes(seg)) && (!q || c.name.toLowerCase().includes(q.toLowerCase())));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24,
      display: "flex",
      flexDirection: "column",
      gap: 14,
      maxWidth: 1100
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontSize: 22,
      fontWeight: 500,
      color: "var(--text-1)"
    }
  }, "Contacts"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--text-3)"
    }
  }, CONTACTS.length, " parties"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    icon: "plus",
    onClick: onAdd
  }, "Add a contact"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 130
    }
  }, /*#__PURE__*/React.createElement(Select, {
    size: "sm",
    defaultValue: "all"
  }, /*#__PURE__*/React.createElement("option", {
    value: "all"
  }, "All contacts"), /*#__PURE__*/React.createElement("option", null, "My book"), /*#__PURE__*/React.createElement("option", null, "Recently added"), /*#__PURE__*/React.createElement("option", null, "Renewals 30d"))), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 240
    }
  }, /*#__PURE__*/React.createElement(Input, {
    size: "sm",
    icon: "search",
    placeholder: "Search by name",
    value: q,
    onChange: e => setQ(e.target.value)
  })), /*#__PURE__*/React.createElement(Chip, {
    selected: seg === "Newcomer",
    icon: "world",
    onClick: () => setSeg(seg === "Newcomer" ? "" : "Newcomer")
  }, "Newcomer"), /*#__PURE__*/React.createElement(Chip, {
    selected: seg === "Super Visa",
    icon: "passport",
    onClick: () => setSeg(seg === "Super Visa" ? "" : "Super Visa")
  }, "Super Visa")), rows.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-1)",
      borderRadius: 12
    }
  }, /*#__PURE__*/React.createElement(EmptyState, {
    icon: "user-search",
    title: "No contacts match",
    body: `Nothing found for "${q}". Check the spelling, or clear the segment filter.`,
    action: /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "sm",
      onClick: () => {
        setQ("");
        setSeg("");
      }
    }, "Clear filters")
  })) : /*#__PURE__*/React.createElement(Table, {
    columns: [{
      header: "Name",
      render: r => /*#__PURE__*/React.createElement("span", {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 8
        }
      }, /*#__PURE__*/React.createElement(Avatar, {
        name: r.name,
        size: "sm"
      }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
        style: {
          fontWeight: 500
        }
      }, r.name), r.segments.map(s => /*#__PURE__*/React.createElement(Badge, {
        key: s,
        tone: "accent",
        style: {
          marginLeft: 6
        }
      }, s))))
    }, {
      header: "Contact",
      render: r => /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 13,
          color: "var(--text-2)"
        }
      }, r.email, /*#__PURE__*/React.createElement("br", null), r.phone)
    }, {
      header: "Products",
      key: "products"
    }, {
      header: "Status",
      render: r => /*#__PURE__*/React.createElement(Badge, {
        tone: r.tone,
        dot: true
      }, r.status)
    }, {
      header: "Owner",
      render: r => /*#__PURE__*/React.createElement(Avatar, {
        name: r.owner,
        size: "sm"
      })
    }, {
      header: "Last activity",
      key: "last",
      align: "right"
    }],
    rows: rows,
    onRowClick: () => onOpen()
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, "Showing ", rows.length, " of ", CONTACTS.length, " \xB7 consent status and full history live on the party record"));
}
function PartyDrawer({
  open,
  onClose,
  onSaved
}) {
  const [lang, setLang] = React.useState("en");
  return /*#__PURE__*/React.createElement(Drawer, {
    open: open,
    title: "Add a contact",
    onClose: onClose,
    width: 420,
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      onClick: onClose
    }, "Cancel"), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      onClick: onSaved
    }, "Save contact"))
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "First name",
    required: true
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "Priya"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Last name",
    required: true
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "Sharma"
  }))), /*#__PURE__*/React.createElement(Field, {
    label: "Email"
  }, /*#__PURE__*/React.createElement(Input, {
    type: "email",
    icon: "mail",
    placeholder: "name@example.ca"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Phone",
    help: "Used for the call screen pop \u2014 include area code."
  }, /*#__PURE__*/React.createElement(Input, {
    icon: "phone",
    placeholder: "(416) 555-0100"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Province"
  }, /*#__PURE__*/React.createElement(Select, {
    defaultValue: "ON"
  }, /*#__PURE__*/React.createElement("option", {
    value: "ON"
  }, "Ontario"), /*#__PURE__*/React.createElement("option", {
    value: "QC"
  }, "Quebec"), /*#__PURE__*/React.createElement("option", {
    value: "BC"
  }, "British Columbia"), /*#__PURE__*/React.createElement("option", {
    value: "AB"
  }, "Alberta"))), /*#__PURE__*/React.createElement(Field, {
    label: "Preferred language"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      paddingTop: 8
    }
  }, /*#__PURE__*/React.createElement(Radio, {
    label: "English",
    checked: lang === "en",
    onChange: () => setLang("en")
  }), /*#__PURE__*/React.createElement(Radio, {
    label: "Fran\xE7ais",
    checked: lang === "fr",
    onChange: () => setLang("fr")
  })))), /*#__PURE__*/React.createElement(Field, {
    label: "Segments"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      paddingTop: 4
    }
  }, /*#__PURE__*/React.createElement(Checkbox, {
    label: "Newcomer to Canada"
  }), /*#__PURE__*/React.createElement(Checkbox, {
    label: "Super Visa applicant"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--tenant-primary-tint)",
      borderRadius: 8,
      padding: 12
    }
  }, /*#__PURE__*/React.createElement(Checkbox, {
    label: "They've agreed to be contacted (CASL consent)"
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "6px 0 0 26px",
      fontSize: 12,
      color: "var(--text-2)"
    }
  }, "Required before any marketing email. Calls about their own policy are always fine."))));
}
const STAGES = [{
  name: "New lead",
  sum: "—",
  cards: [["Aisha Mohamed", "Tenant + auto", "—", "2d", "TK"], ["Diego Morales", "Travel medical · 60d", "—", "1d", "GK"]]
}, {
  name: "Contacted",
  sum: "$310/mo",
  cards: [["Grace Osei", "Disability rider", "$48.20/mo", "3d", "MN"], ["Nikolai Petrov", "Mortgage protection", "$52.60/mo", "1d", "GK"]]
}, {
  name: "Quote sent",
  sum: "$469/mo",
  cards: [["Jean Tremblay", "Super Visa medical", "$168.00/mo", "4d", "GK"], ["Rosa Martinez", "Auto + home bundle", "$212.40/mo", "6d", "TK"], ["Sam & Leah Whitfield", "Mortgage protection", "$89.10/mo", "2d", "MN"]]
}, {
  name: "Application",
  sum: "$196/mo",
  cards: [["Priya Sharma", "Critical illness · $100k", "$38.90/mo", "8d", "GK"], ["Fatima Al-Rashid", "Visitor to Canada", "$142.30/mo", "3d", "MN"]]
}, {
  name: "Underwriting",
  sum: "$446/mo",
  cards: [["Amara Okafor", "Term life · $750k", "$61.40/mo", "12d", "GK"], ["Ted Kowalski", "Commercial GL", "$385.00/mo", "9d", "TK"]]
}];
function Pipeline({
  onOpen
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24,
      display: "flex",
      flexDirection: "column",
      gap: 14,
      height: "100%",
      boxSizing: "border-box"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontSize: 22,
      fontWeight: 500,
      color: "var(--text-1)"
    }
  }, "Pipeline"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--text-3)"
    }
  }, "11 open \xB7 $1,421/mo potential"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 140
    }
  }, /*#__PURE__*/React.createElement(Select, {
    size: "sm",
    defaultValue: "all"
  }, /*#__PURE__*/React.createElement("option", {
    value: "all"
  }, "All verticals"), /*#__PURE__*/React.createElement("option", null, "Life"), /*#__PURE__*/React.createElement("option", null, "Health & travel"), /*#__PURE__*/React.createElement("option", null, "P&C"), /*#__PURE__*/React.createElement("option", null, "Mortgage"))), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "sm",
    icon: "plus"
  }, "New opportunity"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      alignItems: "flex-start",
      overflowX: "auto",
      paddingBottom: 8
    }
  }, STAGES.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.name,
    style: {
      width: 230,
      flex: "none",
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 6,
      padding: "0 2px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      color: "var(--text-1)"
    }
  }, s.name), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, s.cards.length), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, s.sum)), s.cards.map(([name, product, premium, age, owner]) => /*#__PURE__*/React.createElement("div", {
    key: name,
    onClick: () => onOpen(),
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-1)",
      borderRadius: 12,
      padding: 12,
      cursor: "pointer",
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 500,
      color: "var(--text-1)"
    }
  }, name), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--text-2)"
    }
  }, product), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, premium !== "—" ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 500,
      color: "var(--text-2)"
    }
  }, premium) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto"
    }
  }, age, " in stage"), /*#__PURE__*/React.createElement(Avatar, {
    name: owner,
    size: "sm",
    style: {
      width: 20,
      height: 20,
      fontSize: 9
    }
  }))))))));
}
const LEADS = [{
  name: "Harpreet Gill",
  source: "LifeRate.ca",
  vertical: "Life",
  detail: "Term · $500k · Brampton, ON · EN",
  age: "4 min ago",
  hot: true
}, {
  name: "Chantal Bouchard",
  source: "TopRates.ca",
  vertical: "Health",
  detail: "Health + dental · Laval, QC · FR",
  age: "22 min ago",
  hot: true
}, {
  name: "Omar Farouk",
  source: "HealthRate.ca",
  vertical: "Super Visa",
  detail: "Parents visiting · Mississauga, ON · EN",
  age: "1h ago",
  hot: false
}, {
  name: "Jenny Park",
  source: "Referral — KLC",
  vertical: "Mortgage",
  detail: "Protection · $520k · Vancouver, BC · EN",
  age: "3h ago",
  hot: false
}];
function LeadInbox({
  onOpen
}) {
  const [assigned, setAssigned] = React.useState({});
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24,
      display: "flex",
      flexDirection: "column",
      gap: 14,
      maxWidth: 900
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontSize: 22,
      fontWeight: 500,
      color: "var(--text-1)"
    }
  }, "Lead inbox"), /*#__PURE__*/React.createElement(Badge, {
    tone: "accent"
  }, LEADS.filter(l => !assigned[l.name]).length, " unassigned"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      fontSize: 13,
      color: "var(--text-2)"
    }
  }, "Routing rule: by vertical + licence, FR leads \u2192 bilingual producers")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-1)",
      borderRadius: 12,
      overflow: "hidden"
    }
  }, LEADS.map((l, i) => /*#__PURE__*/React.createElement("div", {
    key: l.name,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 16px",
      borderBottom: i < LEADS.length - 1 ? "1px solid var(--border-1)" : "none"
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: l.name
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 500,
      color: "var(--text-1)"
    }
  }, l.name), l.hot ? /*#__PURE__*/React.createElement(Badge, {
    tone: "warning",
    dot: true
  }, "New") : null, /*#__PURE__*/React.createElement(Badge, {
    tone: "accent"
  }, l.vertical)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--text-2)"
    }
  }, l.detail, " \xB7 via ", l.source, " \xB7 ", l.age)), assigned[l.name] ? /*#__PURE__*/React.createElement(Badge, {
    tone: "success",
    dot: true
  }, "Assigned to ", assigned[l.name]) : /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 150
    }
  }, /*#__PURE__*/React.createElement(Select, {
    size: "sm",
    defaultValue: "",
    id: `sel-${i}`
  }, /*#__PURE__*/React.createElement("option", {
    value: "",
    disabled: true
  }, "Assign to\u2026"), /*#__PURE__*/React.createElement("option", null, "Gautam K. (life)"), /*#__PURE__*/React.createElement("option", null, "M. Nguyen (life, FR)"), /*#__PURE__*/React.createElement("option", null, "T. Kowalski (P&C)"))), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "secondary",
    onClick: () => setAssigned({
      ...assigned,
      [l.name]: "M. Nguyen"
    })
  }, "Assign"))))), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, "Unassigned leads escalate to the principal after 30 minutes in business hours."));
}
Object.assign(window, {
  ContactsList,
  PartyDrawer,
  Pipeline,
  LeadInbox
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/insurimple_app/Crm.jsx", error: String((e && e.message) || e) }); }

// ui_kits/insurimple_app/Dashboards.jsx
try { (() => {
const ROLES = {
  "llqp": {
    label: "LLQP (no life)",
    greeting: "Your accident & sickness scorecard",
    metrics: [["A&S policies in force", "312", "+2.4%", "up", "vs last month", "shield-check"], ["Super Visa quotes", "41", "+9", "up", "this week", "passport"], ["Travel med bound", "12", "", "neutral", "this week", "plane"], ["Calls today", "18", "", "neutral", "6 outbound left", "phone"]],
    rows: [{
      client: "Jean Tremblay",
      product: "Super Visa medical",
      stage: "Quote sent",
      tone: "accent",
      premium: "$168.00/mo"
    }, {
      client: "Fatima Al-Rashid",
      product: "Visitor to Canada",
      stage: "Application",
      tone: "info",
      premium: "$142.30/mo"
    }, {
      client: "Diego Morales",
      product: "Travel medical · 60d",
      stage: "New lead",
      tone: "neutral",
      premium: "—"
    }],
    tasks: [["phone", "Call Jean — Super Visa follow-up", "10:30"], ["mail", "Send Fatima the visitor plan comparison", "13:00"], ["file-description", "Renew group travel quote — expires Friday", "Due today"]]
  },
  "life": {
    label: "Life-only",
    greeting: "Your life-only scorecard",
    metrics: [["Policies in force", "1,284", "+3.1%", "up", "vs last month", "shield-check"], ["Quotes this week", "86", "−4", "down", "vs last week", "file-description"], ["Calls today", "23", "", "neutral", "8 outbound left", "phone"], ["Renewals in 30 days", "17", "3 overdue", "down", "", "calendar-due"]],
    rows: [{
      client: "Priya Sharma",
      product: "Term life · $500k",
      stage: "Application",
      tone: "info",
      premium: "$54.20/mo"
    }, {
      client: "Wei Chen",
      product: "Whole life · $250k",
      stage: "Renewal due",
      tone: "warning",
      premium: "$112.75/mo"
    }, {
      client: "Amara Okafor",
      product: "Term life · $750k",
      stage: "Underwriting",
      tone: "info",
      premium: "$61.40/mo"
    }],
    tasks: [["phone", "Call Priya — application follow-up", "10:30"], ["mail", "Send Wei the renewal comparison", "13:00"], ["license", "Upload E&O certificate — expires Aug 1", "Due today"]]
  },
  "mortgage": {
    label: "Mortgage",
    greeting: "Your mortgage protection scorecard",
    metrics: [["Referrals this month", "34", "+12", "up", "from 6 brokers", "building-bank"], ["Protection quotes", "28", "", "neutral", "this week", "file-description"], ["Funded & covered", "9", "+2", "up", "this month", "shield-check"], ["Broker partners", "14", "1 new", "up", "", "users"]],
    rows: [{
      client: "Sam & Leah Whitfield",
      product: "Mortgage protection · $640k",
      stage: "Quote sent",
      tone: "accent",
      premium: "$89.10/mo"
    }, {
      client: "Nikolai Petrov",
      product: "Mortgage protection · $410k",
      stage: "Application",
      tone: "info",
      premium: "$52.60/mo"
    }, {
      client: "Grace Osei",
      product: "Disability rider add-on",
      stage: "New lead",
      tone: "neutral",
      premium: "—"
    }],
    tasks: [["phone", "Call Sam & Leah before closing (July 21)", "11:00"], ["users", "Coffee with Dominion Lending team", "15:30"], ["mail", "Send Grace the rider explainer", "Due today"]]
  },
  "pc-sales": {
    label: "P&C sales",
    greeting: "Your P&C new-business scorecard",
    metrics: [["Bound this month", "$48.2k", "+8.5%", "up", "premium", "shield-check"], ["Open quotes", "31", "", "neutral", "9 aging >7d", "file-description"], ["Close rate", "38%", "+3pt", "up", "vs last quarter", "chart-bar"], ["Calls today", "26", "", "neutral", "12 outbound left", "phone"]],
    rows: [{
      client: "Rosa Martinez",
      product: "Auto + home bundle",
      stage: "Quote sent",
      tone: "accent",
      premium: "$212.40/mo"
    }, {
      client: "Ted Kowalski",
      product: "Commercial GL · retail",
      stage: "Underwriting",
      tone: "info",
      premium: "$385.00/mo"
    }, {
      client: "Aisha Mohamed",
      product: "Tenant + auto",
      stage: "New lead",
      tone: "neutral",
      premium: "—"
    }],
    tasks: [["phone", "Call Rosa — bundle discount expires today", "10:00"], ["car", "Ontario auto elections form for Ted", "14:00"], ["mail", "Quote follow-ups — 9 aging", "Due today"]]
  },
  "pc-service": {
    label: "P&C service",
    greeting: "Your service desk today",
    metrics: [["Open requests", "23", "5 urgent", "down", "", "inbox"], ["Endorsements today", "11", "", "neutral", "4 done", "file-pencil"], ["Renewals to review", "42", "", "neutral", "next 30 days", "calendar-due"], ["Avg. response", "2.1h", "−0.4h", "up", "vs last week", "clock"]],
    rows: [{
      client: "Rosa Martinez",
      product: "Add driver — auto POL-8812",
      stage: "In progress",
      tone: "info",
      premium: ""
    }, {
      client: "Ted Kowalski",
      product: "Certificate of insurance",
      stage: "Urgent",
      tone: "danger",
      premium: ""
    }, {
      client: "Marie Gagnon",
      product: "Address change — home",
      stage: "New request",
      tone: "neutral",
      premium: ""
    }],
    tasks: [["file-pencil", "Process Ted's COI — needed for landlord", "ASAP"], ["phone", "Call Marie — confirm effective date", "11:30"], ["calendar-due", "Renewal review batch — July 20 list", "Due today"]]
  },
  "admin": {
    label: "Admin / principal",
    greeting: "Brokerage roll-up — production & compliance",
    metrics: [["Written premium MTD", "$186k", "+6.2%", "up", "vs last July", "chart-bar"], ["Active producers", "12", "", "neutral", "2 hiring", "users"], ["Compliance exceptions", "4", "2 new", "down", "", "alert-triangle"], ["Licences expiring 60d", "3", "", "neutral", "1 E&O", "license"]],
    rows: [{
      client: "G. Khosla",
      product: "E&O certificate expired",
      stage: "Exception",
      tone: "danger",
      premium: ""
    }, {
      client: "M. Nguyen",
      product: "LLQP renewal due Aug 12",
      stage: "Expiring",
      tone: "warning",
      premium: ""
    }, {
      client: "Unsigned consent",
      product: "3 parties contacted w/o CASL consent",
      stage: "Exception",
      tone: "danger",
      premium: ""
    }],
    tasks: [["license", "Chase E&O renewals — 3 outstanding", "Due today"], ["chart-bar", "July production review with team leads", "16:00"], ["settings", "Approve NorthPeak theme change request", "This week"]]
  }
};
function Dashboards({
  role,
  onRole,
  onOpenContact
}) {
  const d = ROLES[role];
  const isAdmin = role === "admin";
  const isService = role === "pc-service" || isAdmin;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24,
      display: "flex",
      flexDirection: "column",
      gap: 20,
      maxWidth: 1100
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-end",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontSize: 22,
      fontWeight: 500,
      color: "var(--text-1)"
    }
  }, "Good morning, Gautam"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "4px 0 0",
      fontSize: 14,
      color: "var(--text-2)"
    }
  }, d.greeting, " \xB7 Monday, July 13")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: "auto",
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, "Role"), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 170
    }
  }, /*#__PURE__*/React.createElement(Select, {
    size: "sm",
    value: role,
    onChange: e => onRole(e.target.value)
  }, Object.keys(ROLES).map(k => /*#__PURE__*/React.createElement("option", {
    key: k,
    value: k
  }, ROLES[k].label)))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 12
    }
  }, d.metrics.map(([label, value, delta, tone, hint, icon]) => /*#__PURE__*/React.createElement(MetricCard, {
    key: label,
    label: label,
    value: value,
    delta: delta || undefined,
    deltaTone: tone,
    hint: hint || undefined,
    icon: icon
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1.6fr 1fr",
      gap: 12,
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: 16,
      fontWeight: 500,
      color: "var(--text-1)"
    }
  }, isAdmin ? "Compliance — needs attention" : isService ? "Queue — needs attention" : "Pipeline — needs attention"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm",
    icon: "arrow-right"
  }, isAdmin ? "All exceptions" : "View all"))), /*#__PURE__*/React.createElement(Table, {
    columns: [{
      header: isAdmin ? "Item" : "Client",
      render: r => /*#__PURE__*/React.createElement("span", {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 8
        }
      }, !isAdmin ? /*#__PURE__*/React.createElement(Avatar, {
        name: r.client,
        size: "sm"
      }) : /*#__PURE__*/React.createElement("i", {
        className: "ti ti-alert-circle",
        style: {
          color: "var(--warning)",
          fontSize: 18
        }
      }), /*#__PURE__*/React.createElement("span", {
        style: {
          fontWeight: 500
        }
      }, r.client))
    }, {
      header: isAdmin ? "Detail" : "Product",
      key: "product"
    }, {
      header: isAdmin ? "Type" : "Stage",
      render: r => /*#__PURE__*/React.createElement(Badge, {
        tone: r.tone,
        dot: true
      }, r.stage)
    }, ...(d.rows[0].premium !== "" ? [{
      header: "Premium",
      key: "premium",
      align: "right"
    }] : [])],
    rows: d.rows,
    onRowClick: () => onOpenContact()
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: 16,
      fontWeight: 500,
      color: "var(--text-1)"
    }
  }, "Today's tasks"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-1)",
      borderRadius: 12,
      overflow: "hidden"
    }
  }, d.tasks.map(([icon, title, meta], i) => /*#__PURE__*/React.createElement(ListRow, {
    key: title,
    leading: /*#__PURE__*/React.createElement("i", {
      className: `ti ti-${icon}`,
      style: {
        color: "var(--tenant-primary)",
        fontSize: 18
      }
    }),
    title: title,
    meta: meta,
    onClick: () => {},
    style: i === d.tasks.length - 1 ? {
      borderBottom: "none"
    } : undefined
  }))))));
}
window.Dashboards = Dashboards;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/insurimple_app/Dashboards.jsx", error: String((e && e.message) || e) }); }

// ui_kits/insurimple_app/Docs.jsx
try { (() => {
function DocCenter({
  onBack
}) {
  const [doc, setDoc] = React.useState(0);
  const docs = [{
    name: "Application — critical illness",
    status: "Signed",
    tone: "success",
    date: "July 2"
  }, {
    name: "Consent & CASL disclosure",
    status: "Signed",
    tone: "success",
    date: "July 2"
  }, {
    name: "Quote summary",
    status: "Awaiting signature",
    tone: "warning",
    date: "July 10"
  }];
  const d = docs[doc];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24,
      display: "flex",
      flexDirection: "column",
      gap: 16,
      maxWidth: 1100
    }
  }, /*#__PURE__*/React.createElement("a", {
    onClick: onBack,
    style: {
      fontSize: 13,
      color: "var(--text-3)",
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ti ti-arrow-left"
  }), "TXN-118"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontSize: 22,
      fontWeight: 500,
      color: "var(--text-1)"
    }
  }, "Documents \u2014 TXN-118"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 200
    }
  }, /*#__PURE__*/React.createElement(Select, {
    size: "sm",
    defaultValue: ""
  }, /*#__PURE__*/React.createElement("option", {
    value: "",
    disabled: true
  }, "Generate from template\u2026"), /*#__PURE__*/React.createElement("option", null, "Quote summary"), /*#__PURE__*/React.createElement("option", null, "Letter of experience"), /*#__PURE__*/React.createElement("option", null, "Invoice / receipt"), /*#__PURE__*/React.createElement("option", null, "Policy summary"))), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "sm",
    icon: "signature"
  }, "Send for signature"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1.5fr",
      gap: 12,
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-1)",
      borderRadius: 12,
      overflow: "hidden"
    }
  }, docs.map((x, i) => /*#__PURE__*/React.createElement(ListRow, {
    key: x.name,
    selected: i === doc,
    onClick: () => setDoc(i),
    leading: /*#__PURE__*/React.createElement("i", {
      className: "ti ti-file-text",
      style: {
        color: "var(--tenant-primary)",
        fontSize: 17
      }
    }),
    title: x.name,
    subtitle: `Generated ${x.date}`,
    trailing: /*#__PURE__*/React.createElement(Badge, {
      tone: x.tone,
      dot: true
    }, x.status),
    style: i === docs.length - 1 ? {
      borderBottom: "none"
    } : undefined
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-1)",
      borderRadius: 12,
      padding: 16,
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 500,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: "var(--text-3)"
    }
  }, "Signature trail \u2014 ", d.name), [["Sent to priya.s@example.ca", "July 10 · 09:14", true], ["Opened on mobile", "July 10 · 12:40", true], ["Signed", d.tone === "success" ? "July 10 · 12:44" : "Waiting — reminder goes out July 14", d.tone === "success"]].map(([t, s, done]) => /*#__PURE__*/React.createElement("span", {
    key: t,
    style: {
      display: "flex",
      gap: 10,
      alignItems: "flex-start"
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: `ti ti-${done ? "circle-check" : "clock"}`,
    style: {
      color: done ? "var(--success)" : "var(--warning)",
      fontSize: 17,
      flex: "none"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--text-1)",
      lineHeight: 1.4
    }
  }, t, /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, s)))))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-sunken)",
      border: "1px solid var(--border-1)",
      borderRadius: 12,
      padding: 24,
      display: "flex",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 420,
      background: "#fff",
      borderRadius: 4,
      boxShadow: "var(--shadow-float)",
      padding: "36px 40px",
      display: "flex",
      flexDirection: "column",
      gap: 14,
      minHeight: 460,
      boxSizing: "border-box"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16,
      fontWeight: 500,
      letterSpacing: "-0.02em",
      color: "var(--tenant-primary-deep)"
    }
  }, "NorthPeak Insurance"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      color: "var(--mist)"
    }
  }, "Tenant-themed PDF")), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: "var(--border-1)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 500,
      color: "var(--ink)"
    }
  }, d.name), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--slate)",
      lineHeight: 1.6
    }
  }, "Prepared for Priya Sharma \xB7 July 2026", /*#__PURE__*/React.createElement("br", null), "Policy basis: critical illness, $100,000, Maple Mutual"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
      marginTop: 4
    }
  }, [86, 70, 92, 64, 78, 88, 58].map((w, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      height: 7,
      width: `${w}%`,
      background: "var(--sand-deep)",
      borderRadius: 3
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "auto",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "var(--mist)"
    }
  }, "Page 1 of 3 \xB7 generated by Insurimple"), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 120,
      borderTop: "1px solid var(--border-2)",
      paddingTop: 4,
      fontSize: 9,
      color: "var(--mist)",
      textAlign: "center"
    }
  }, d.tone === "success" ? "Signed — P. Sharma" : "Signature"))))));
}
window.DocCenter = DocCenter;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/insurimple_app/Docs.jsx", error: String((e && e.message) || e) }); }

// ui_kits/insurimple_app/Global.jsx
try { (() => {
function CommandBar({
  open,
  onClose,
  onGo
}) {
  if (!open) return null;
  const results = [["user", "Priya Sharma", "Contact · Toronto, ON", "contact"], ["file-invoice", "POL-2041 — Term life", "Policy · Priya Sharma", "policy"], ["file-pencil", "TXN-118 — Critical illness", "Transaction · underwriting", "txn"], ["plus", "New transaction…", "Action", "newtxn"], ["phone", "Call Priya Sharma", "Action · (416) 555-0182", "call"]];
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(12,27,34,0.4)",
      zIndex: 250,
      display: "flex",
      justifyContent: "center",
      paddingTop: 90
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: 560,
      alignSelf: "flex-start",
      background: "var(--surface-popover)",
      borderRadius: 12,
      boxShadow: "var(--shadow-overlay)",
      overflow: "hidden",
      fontFamily: "var(--font-sans)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "14px 16px",
      borderBottom: "1px solid var(--border-1)"
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ti ti-search",
    style: {
      fontSize: 18,
      color: "var(--text-3)"
    }
  }), /*#__PURE__*/React.createElement("input", {
    autoFocus: true,
    placeholder: "Search contacts, policies \u2014 or type a command",
    style: {
      flex: 1,
      border: "none",
      outline: "none",
      fontSize: 15,
      fontFamily: "inherit",
      color: "var(--text-1)",
      background: "transparent"
    },
    defaultValue: "pri"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--text-3)",
      border: "1px solid var(--border-1)",
      borderRadius: 5,
      padding: "1px 6px"
    }
  }, "esc")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 6
    }
  }, results.map(([icon, title, sub, key], i) => /*#__PURE__*/React.createElement("div", {
    key: title,
    onClick: () => onGo(key),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "9px 10px",
      borderRadius: 8,
      cursor: "pointer",
      background: i === 0 ? "var(--tenant-primary-tint)" : "transparent"
    },
    onMouseEnter: e => e.currentTarget.style.background = "var(--tenant-primary-tint)",
    onMouseLeave: e => e.currentTarget.style.background = i === 0 ? "var(--tenant-primary-tint)" : "transparent"
  }, /*#__PURE__*/React.createElement("i", {
    className: `ti ti-${icon}`,
    style: {
      fontSize: 17,
      color: "var(--tenant-primary)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: "var(--text-1)",
      fontWeight: 500
    }
  }, title), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, sub)))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "8px 16px",
      borderTop: "1px solid var(--border-1)",
      fontSize: 11,
      color: "var(--text-3)",
      display: "flex",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", null, "\u2191\u2193 navigate"), /*#__PURE__*/React.createElement("span", null, "\u21B5 open"), /*#__PURE__*/React.createElement("span", null, "\u2318K anywhere"))));
}
const NOTIFS = [["phone-incoming", "Missed call from Wei Chen", "No voicemail · 09:12", false], ["signature", "Priya signed the CI application", "TXN-118 moved to Submitted", false], ["alert-triangle", "E&O certificate expires Aug 1", "Quoting locks on expiry — renew now", true], ["mail", "Renewal campaign finished", "214 sent · 38% opened", false], ["user-plus", "Dana accepted your invite", "P&C service · first sign-in today", false]];
function NotificationsDrawer({
  open,
  onClose
}) {
  return /*#__PURE__*/React.createElement(Drawer, {
    open: open,
    title: "Notifications",
    onClose: onClose,
    width: 360
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 4,
      margin: "-8px -8px 0"
    }
  }, NOTIFS.map(([icon, title, sub, urgent]) => /*#__PURE__*/React.createElement("div", {
    key: title,
    style: {
      display: "flex",
      gap: 10,
      padding: "10px 8px",
      borderRadius: 8,
      alignItems: "flex-start"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 32,
      height: 32,
      flex: "none",
      borderRadius: 8,
      background: urgent ? "var(--warning-tint)" : "var(--tenant-primary-tint)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: `ti ti-${icon}`,
    style: {
      fontSize: 16,
      color: urgent ? "var(--warning)" : "var(--tenant-primary)"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      color: "var(--text-1)",
      lineHeight: 1.4
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-2)"
    }
  }, sub)))), /*#__PURE__*/React.createElement("a", {
    style: {
      fontSize: 13,
      padding: "10px 8px",
      cursor: "pointer"
    }
  }, "Notification preferences")));
}
Object.assign(window, {
  CommandBar,
  NotificationsDrawer
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/insurimple_app/Global.jsx", error: String((e && e.message) || e) }); }

// ui_kits/insurimple_app/Growth.jsx
try { (() => {
const CAMPAIGNS = [{
  name: "Renewal reminders — auto",
  type: "Nurture",
  status: "Running",
  tone: "success",
  audience: "Renewals in 60d",
  sent: "214",
  opened: "38%",
  last: "Today"
}, {
  name: "Super Visa guide series",
  type: "Nurture",
  status: "Running",
  tone: "success",
  audience: "Super Visa leads",
  sent: "86",
  opened: "52%",
  last: "Today"
}, {
  name: "July newsletter",
  type: "One-time",
  status: "Draft",
  tone: "neutral",
  audience: "All consented clients",
  sent: "—",
  opened: "—",
  last: "2d ago"
}, {
  name: "Life cross-sell — new parents",
  type: "Nurture",
  status: "Paused",
  tone: "warning",
  audience: "Segment: new parents",
  sent: "42",
  opened: "44%",
  last: "May 30"
}];
function Campaigns({
  onSegment
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24,
      display: "flex",
      flexDirection: "column",
      gap: 14,
      maxWidth: 1100
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontSize: 22,
      fontWeight: 500,
      color: "var(--text-1)"
    }
  }, "Growth"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--text-3)"
    }
  }, "Campaigns send only to contacts with CASL consent \u2014 412 of 480"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm",
    icon: "users",
    onClick: onSegment
  }, "Segments"), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "sm",
    icon: "plus"
  }, "New campaign"))), /*#__PURE__*/React.createElement(Table, {
    columns: [{
      header: "Campaign",
      render: r => /*#__PURE__*/React.createElement("span", {
        style: {
          fontWeight: 500
        }
      }, r.name)
    }, {
      header: "Type",
      key: "type"
    }, {
      header: "Audience",
      key: "audience"
    }, {
      header: "Status",
      render: r => /*#__PURE__*/React.createElement(Badge, {
        tone: r.tone,
        dot: true
      }, r.status)
    }, {
      header: "Sent",
      key: "sent",
      align: "right"
    }, {
      header: "Opened",
      key: "opened",
      align: "right"
    }, {
      header: "Last activity",
      key: "last",
      align: "right"
    }],
    rows: CAMPAIGNS,
    onRowClick: () => {}
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--tenant-primary-tint)",
      borderRadius: 12,
      padding: 14,
      fontSize: 13,
      color: "var(--text-1)",
      display: "flex",
      gap: 10,
      maxWidth: 640
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ti ti-shield-check",
    style: {
      fontSize: 18,
      color: "var(--tenant-primary)",
      flex: "none"
    }
  }), /*#__PURE__*/React.createElement("span", null, "Unsubscribes apply instantly across all campaigns. The preference centre is public and themed to your brand.")));
}
function SegmentBuilder({
  onBack
}) {
  const [rules, setRules] = React.useState([["Product line", "is", "Personal auto"], ["Renewal date", "is within", "next 60 days"], ["CASL consent", "is", "given"]]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24,
      display: "flex",
      flexDirection: "column",
      gap: 14,
      maxWidth: 900
    }
  }, /*#__PURE__*/React.createElement("a", {
    onClick: onBack,
    style: {
      fontSize: 13,
      color: "var(--text-3)",
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ti ti-arrow-left"
  }), "Growth"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontSize: 22,
      fontWeight: 500,
      color: "var(--text-1)"
    }
  }, "Segment \u2014 auto renewals 60d"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm"
  }, "Save as draft"), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "sm"
  }, "Save segment"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1.5fr 1fr",
      gap: 12,
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-1)",
      borderRadius: 12,
      padding: 16,
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 500,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: "var(--text-3)"
    }
  }, "Match all of these"), rules.map(([field, op, val], i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1.2
    }
  }, /*#__PURE__*/React.createElement(Select, {
    size: "sm",
    defaultValue: field
  }, /*#__PURE__*/React.createElement("option", null, "Product line"), /*#__PURE__*/React.createElement("option", null, "Renewal date"), /*#__PURE__*/React.createElement("option", null, "CASL consent"), /*#__PURE__*/React.createElement("option", null, "Province"), /*#__PURE__*/React.createElement("option", null, "Segment tag"), /*#__PURE__*/React.createElement("option", null, "Owner"))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 0.8
    }
  }, /*#__PURE__*/React.createElement(Select, {
    size: "sm",
    defaultValue: op
  }, /*#__PURE__*/React.createElement("option", null, "is"), /*#__PURE__*/React.createElement("option", null, "is not"), /*#__PURE__*/React.createElement("option", null, "is within"), /*#__PURE__*/React.createElement("option", null, "contains"))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1.2
    }
  }, /*#__PURE__*/React.createElement(Input, {
    size: "sm",
    defaultValue: val
  })), /*#__PURE__*/React.createElement(IconButton, {
    icon: "x",
    label: "Remove rule",
    size: "sm",
    onClick: () => setRules(rules.filter((_, j) => j !== i))
  }))), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm",
    icon: "plus",
    style: {
      alignSelf: "flex-start"
    },
    onClick: () => setRules([...rules, ["Province", "is", "Ontario"]])
  }, "Add a rule")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-1)",
      borderRadius: 12,
      padding: 16,
      display: "flex",
      flexDirection: "column",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 500,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: "var(--text-3)"
    }
  }, "Live estimate"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 28,
      fontWeight: 500,
      color: "var(--text-1)",
      fontVariantNumeric: "tabular-nums"
    }
  }, "63 contacts"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--text-2)"
    }
  }, "58 with email \xB7 61 with phone \xB7 all consented")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-1)",
      borderRadius: 12,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement(ListRow, {
    leading: /*#__PURE__*/React.createElement(Avatar, {
      name: "Rosa Martinez",
      size: "sm"
    }),
    title: "Rosa Martinez",
    subtitle: "Auto renews Nov 12"
  }), /*#__PURE__*/React.createElement(ListRow, {
    leading: /*#__PURE__*/React.createElement(Avatar, {
      name: "Marie Gagnon",
      size: "sm"
    }),
    title: "Marie Gagnon",
    subtitle: "Auto renews Sept 3"
  }), /*#__PURE__*/React.createElement(ListRow, {
    leading: /*#__PURE__*/React.createElement(Avatar, {
      name: "Devon Clarke",
      size: "sm"
    }),
    title: "Devon Clarke",
    subtitle: "Auto renews Aug 21",
    style: {
      borderBottom: "none"
    }
  })))));
}
function Reports({
  onOpenContact
}) {
  const bars = [["Feb", 62], ["Mar", 70], ["Apr", 66], ["May", 78], ["Jun", 84], ["Jul", 91]];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24,
      display: "flex",
      flexDirection: "column",
      gap: 16,
      maxWidth: 1100
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontSize: 22,
      fontWeight: 500,
      color: "var(--text-1)"
    }
  }, "Reports"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--text-3)"
    }
  }, "Brokerage-wide \xB7 July 2026"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm",
    icon: "download"
  }, "Export CSV"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(MetricCard, {
    label: "Written premium MTD",
    value: "$186k",
    delta: "+6.2%",
    deltaTone: "up",
    hint: "vs last July",
    icon: "chart-bar"
  }), /*#__PURE__*/React.createElement(MetricCard, {
    label: "Policies in force",
    value: "2,148",
    delta: "+41",
    deltaTone: "up",
    hint: "net this month",
    icon: "shield-check"
  }), /*#__PURE__*/React.createElement(MetricCard, {
    label: "Retention",
    value: "91.4%",
    delta: "+0.8pt",
    deltaTone: "up",
    hint: "rolling 12mo",
    icon: "repeat"
  }), /*#__PURE__*/React.createElement(MetricCard, {
    label: "Compliance exceptions",
    value: "4",
    delta: "2 new",
    deltaTone: "down",
    hint: "this week",
    icon: "alert-triangle"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1.4fr 1fr",
      gap: 12,
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-1)",
      borderRadius: 12,
      padding: 18,
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline"
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: 16,
      fontWeight: 500,
      color: "var(--text-1)"
    }
  }, "Book growth \u2014 new premium by month"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, "$k")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-end",
      gap: 18,
      height: 150,
      paddingTop: 8
    }
  }, bars.map(([m, v], i) => /*#__PURE__*/React.createElement("div", {
    key: m,
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 6,
      height: "100%",
      justifyContent: "flex-end"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--text-2)",
      fontVariantNumeric: "tabular-nums"
    }
  }, v), /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      maxWidth: 44,
      height: `${v}%`,
      background: i === bars.length - 1 ? "var(--tenant-primary)" : "var(--tenant-primary-tint)",
      borderRadius: 6
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, m))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: 16,
      fontWeight: 500,
      color: "var(--text-1)"
    }
  }, "Compliance exceptions"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-1)",
      borderRadius: 12,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement(ListRow, {
    leading: /*#__PURE__*/React.createElement("i", {
      className: "ti ti-license",
      style: {
        color: "var(--danger)",
        fontSize: 17
      }
    }),
    title: "E&O expired \u2014 G. Khosla",
    subtitle: "Quoting locked until renewed",
    trailing: /*#__PURE__*/React.createElement(Badge, {
      tone: "danger",
      dot: true
    }, "Blocking"),
    onClick: () => {}
  }), /*#__PURE__*/React.createElement(ListRow, {
    leading: /*#__PURE__*/React.createElement("i", {
      className: "ti ti-license",
      style: {
        color: "var(--warning)",
        fontSize: 17
      }
    }),
    title: "LLQP expires Aug 12 \u2014 M. Nguyen",
    subtitle: "30 days out",
    trailing: /*#__PURE__*/React.createElement(Badge, {
      tone: "warning"
    }, "Soon"),
    onClick: () => {}
  }), /*#__PURE__*/React.createElement(ListRow, {
    leading: /*#__PURE__*/React.createElement("i", {
      className: "ti ti-mail-x",
      style: {
        color: "var(--warning)",
        fontSize: 17
      }
    }),
    title: "3 parties emailed without consent",
    subtitle: "Campaign check caught it \u2014 review list",
    trailing: /*#__PURE__*/React.createElement(Badge, {
      tone: "warning"
    }, "Review"),
    onClick: onOpenContact,
    style: {
      borderBottom: "none"
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, "Exceptions clear automatically when the underlying item is fixed."))));
}
Object.assign(window, {
  Campaigns,
  SegmentBuilder,
  Reports
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/insurimple_app/Growth.jsx", error: String((e && e.message) || e) }); }

// ui_kits/insurimple_app/Settings.jsx
try { (() => {
const TEAM = [{
  name: "Gautam Khosla",
  email: "gautam@brokerage.ca",
  role: "Admin / principal",
  licences: "LLQP · Life",
  status: "Active",
  tone: "success"
}, {
  name: "Mai Nguyen",
  email: "mai@brokerage.ca",
  role: "Life producer",
  licences: "LLQP · Life (FR)",
  status: "Active",
  tone: "success"
}, {
  name: "Ted Kowalski",
  email: "ted@brokerage.ca",
  role: "P&C sales",
  licences: "RIBO",
  status: "Active",
  tone: "success"
}, {
  name: "Dana Wilson",
  email: "dana@brokerage.ca",
  role: "P&C service",
  licences: "RIBO",
  status: "Invited",
  tone: "info"
}];
const CAPS = [["View contacts & policies", [1, 1, 1, 1, 1, 1]], ["Create & edit parties", [1, 1, 1, 1, 1, 1]], ["Quote life products", [0, 1, 0, 0, 0, 1]], ["Bind P&C new business", [0, 0, 0, 1, 0, 1]], ["Process endorsements", [0, 0, 0, 1, 1, 1]], ["Send marketing campaigns", [0, 0, 0, 0, 0, 1]], ["View all reports", [0, 0, 0, 0, 0, 1]], ["Manage team & branding", [0, 0, 0, 0, 0, 1]]];
const CAP_ROLES = ["LLQP (no life)", "Life-only", "Mortgage", "P&C sales", "P&C service", "Admin"];
const LICENCES = [{
  who: "Gautam Khosla",
  type: "LLQP — Ontario",
  num: "ON-482910",
  expires: "Feb 12, 2027",
  tone: "success",
  status: "Valid"
}, {
  who: "Gautam Khosla",
  type: "E&O certificate",
  num: "EO-2025-114",
  expires: "Aug 1, 2026",
  tone: "warning",
  status: "Expires in 19 days"
}, {
  who: "Mai Nguyen",
  type: "LLQP — Ontario",
  num: "ON-518204",
  expires: "Aug 12, 2026",
  tone: "warning",
  status: "Expires in 30 days"
}, {
  who: "Ted Kowalski",
  type: "RIBO — Level 2",
  num: "RB-30871",
  expires: "Sep 30, 2027",
  tone: "success",
  status: "Valid"
}];
function SettingsScreen({
  onInvite
}) {
  const [section, setSection] = React.useState("team");
  const [brand, setBrand] = React.useState("#12796A");
  const items = [["team", "users", "Team"], ["roles", "shield-lock", "Roles & capabilities"], ["licences", "license", "Licences on file"], ["branding", "palette", "Branding"], ["integrations", "plug", "Integrations"], ["billing", "credit-card", "Billing"]];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24,
      display: "flex",
      gap: 20,
      maxWidth: 1100,
      alignItems: "flex-start"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 200,
      flex: "none",
      display: "flex",
      flexDirection: "column",
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: "0 0 10px",
      fontSize: 22,
      fontWeight: 500,
      color: "var(--text-1)"
    }
  }, "Settings"), items.map(([k, icon, label]) => /*#__PURE__*/React.createElement("a", {
    key: k,
    onClick: () => setSection(k),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      padding: "8px 10px",
      borderRadius: 8,
      cursor: "pointer",
      fontSize: 14,
      fontWeight: section === k ? 500 : 400,
      color: section === k ? "var(--tenant-primary-deep)" : "var(--text-2)",
      background: section === k ? "var(--tenant-primary-tint)" : "transparent"
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: `ti ti-${icon}`,
    style: {
      fontSize: 17
    }
  }), label))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, section === "team" ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: 17,
      fontWeight: 500,
      color: "var(--text-1)"
    }
  }, "Team"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "sm",
    icon: "user-plus",
    onClick: onInvite
  }, "Invite someone"))), /*#__PURE__*/React.createElement(Table, {
    columns: [{
      header: "Name",
      render: r => /*#__PURE__*/React.createElement("span", {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 8
        }
      }, /*#__PURE__*/React.createElement(Avatar, {
        name: r.name,
        size: "sm"
      }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
        style: {
          fontWeight: 500
        }
      }, r.name), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 12,
          color: "var(--text-3)"
        }
      }, r.email)))
    }, {
      header: "Role",
      key: "role"
    }, {
      header: "Licences",
      key: "licences"
    }, {
      header: "Status",
      render: r => /*#__PURE__*/React.createElement(Badge, {
        tone: r.tone,
        dot: true
      }, r.status)
    }, {
      header: "",
      render: () => /*#__PURE__*/React.createElement(IconButton, {
        icon: "dots",
        label: "More",
        size: "sm"
      })
    }],
    rows: TEAM
  })) : section === "roles" ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: 17,
      fontWeight: 500,
      color: "var(--text-1)"
    }
  }, "Roles & capabilities"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "-6px 0 0",
      fontSize: 13,
      color: "var(--text-2)"
    }
  }, "Capabilities gate what each role can see and do. Licence gates apply on top \u2014 an expired licence suspends quoting automatically."), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-1)",
      borderRadius: 12,
      overflow: "auto"
    }
  }, /*#__PURE__*/React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: "left",
      padding: "10px 14px",
      fontSize: 11,
      fontWeight: 500,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: "var(--text-3)",
      background: "var(--surface-panel)",
      borderBottom: "1px solid var(--border-1)"
    }
  }, "Capability"), CAP_ROLES.map(r => /*#__PURE__*/React.createElement("th", {
    key: r,
    style: {
      padding: "10px 8px",
      fontSize: 10,
      fontWeight: 500,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      color: "var(--text-3)",
      background: "var(--surface-panel)",
      borderBottom: "1px solid var(--border-1)",
      whiteSpace: "nowrap"
    }
  }, r)))), /*#__PURE__*/React.createElement("tbody", null, CAPS.map(([cap, flags], ri) => /*#__PURE__*/React.createElement("tr", {
    key: cap
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      padding: "9px 14px",
      color: "var(--text-1)",
      borderBottom: ri < CAPS.length - 1 ? "1px solid var(--border-1)" : "none"
    }
  }, cap), flags.map((f, i) => /*#__PURE__*/React.createElement("td", {
    key: i,
    style: {
      textAlign: "center",
      padding: "9px 8px",
      borderBottom: ri < CAPS.length - 1 ? "1px solid var(--border-1)" : "none"
    }
  }, f ? /*#__PURE__*/React.createElement("i", {
    className: "ti ti-check",
    style: {
      color: "var(--tenant-primary)",
      fontSize: 16
    }
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--border-2)"
    }
  }, "\u2014"))))))))) : section === "licences" ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: 17,
      fontWeight: 500,
      color: "var(--text-1)"
    }
  }, "Licences on file"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm",
    icon: "upload"
  }, "Upload licence"))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--warning-tint)",
      borderRadius: 8,
      padding: "10px 12px",
      fontSize: 13,
      color: "var(--warning)",
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ti ti-alert-triangle",
    style: {
      fontSize: 16,
      flex: "none",
      marginTop: 1
    }
  }), /*#__PURE__*/React.createElement("span", null, "2 licences expire within 30 days. Quoting locks automatically on the expiry date \u2014 renew before then.")), /*#__PURE__*/React.createElement(Table, {
    columns: [{
      header: "Holder",
      render: r => /*#__PURE__*/React.createElement("span", {
        style: {
          fontWeight: 500
        }
      }, r.who)
    }, {
      header: "Licence",
      key: "type"
    }, {
      header: "Number",
      key: "num"
    }, {
      header: "Expires",
      key: "expires"
    }, {
      header: "Status",
      render: r => /*#__PURE__*/React.createElement(Badge, {
        tone: r.tone,
        dot: true
      }, r.status)
    }],
    rows: LICENCES
  })) : section === "integrations" ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: 17,
      fontWeight: 500,
      color: "var(--text-1)"
    }
  }, "Integrations"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "-6px 0 0",
      fontSize: 13,
      color: "var(--text-2)"
    }
  }, "Connections run under your tenant's credentials. Disconnecting never deletes your data."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, [["phone", "Twilio", "Telephony — softphone, recording, SMS", true], ["mail", "Resend", "Transactional & campaign email", true], ["download", "CSIOnet / IVANS", "Carrier downloads — nightly sync", true], ["calendar", "Google Calendar", "Follow-ups & bookings", false], ["mailbox", "Microsoft 365", "Email sync to the activity timeline", false]].map(([icon, name, sub, on]) => /*#__PURE__*/React.createElement("div", {
    key: name,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 16px",
      border: "1px solid var(--border-1)",
      borderRadius: 12,
      background: "var(--surface-card)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 36,
      height: 36,
      borderRadius: 8,
      background: "var(--tenant-primary-tint)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: `ti ti-${icon}`,
    style: {
      fontSize: 18,
      color: "var(--tenant-primary)"
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 500,
      color: "var(--text-1)"
    }
  }, name), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-2)"
    }
  }, sub)), on ? /*#__PURE__*/React.createElement(Badge, {
    tone: "success",
    dot: true
  }, "Connected") : /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm"
  }, "Connect"))))) : section === "billing" ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: 17,
      fontWeight: 500,
      color: "var(--text-1)"
    }
  }, "Billing"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12,
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-1)",
      borderRadius: 12,
      padding: 16,
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 500,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: "var(--text-3)"
    }
  }, "Current plan"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 18,
      fontWeight: 500,
      color: "var(--text-1)"
    }
  }, "Brokerage + white label"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--text-2)"
    }
  }, "4 seats \xD7 $119 \xB7 $476/mo CAD \xB7 renews Aug 1"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--text-2)"
    }
  }, "Payment: Visa \u2022\u20221942"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm"
  }, "Change plan"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm"
  }, "Update card"))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-1)",
      borderRadius: 12,
      overflow: "hidden"
    }
  }, [["July 1, 2026", "$476.00", "Paid"], ["June 1, 2026", "$476.00", "Paid"], ["May 1, 2026", "$357.00", "Paid"]].map(([d, amt, st], i, arr) => /*#__PURE__*/React.createElement(ListRow, {
    key: d,
    leading: /*#__PURE__*/React.createElement("i", {
      className: "ti ti-receipt",
      style: {
        color: "var(--tenant-primary)",
        fontSize: 17
      }
    }),
    title: `Invoice — ${d}`,
    meta: amt,
    trailing: /*#__PURE__*/React.createElement(Badge, {
      tone: "success",
      dot: true
    }, st),
    onClick: () => {},
    style: i === arr.length - 1 ? {
      borderBottom: "none"
    } : undefined
  }))))) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: 17,
      fontWeight: 500,
      color: "var(--text-1)"
    }
  }, "Tenant branding"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "-6px 0 0",
      fontSize: 13,
      color: "var(--text-2)"
    }
  }, "Your brand applies everywhere \u2014 app, emails, PDFs, client pages. Changes preview live before you publish."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12,
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-1)",
      borderRadius: 12,
      padding: 16,
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Brokerage name"
  }, /*#__PURE__*/React.createElement(Input, {
    defaultValue: "NorthPeak Insurance"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Logo",
    help: "SVG or PNG, transparent background."
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      border: "1px dashed var(--border-2)",
      borderRadius: 8,
      padding: "18px 12px",
      textAlign: "center",
      fontSize: 13,
      color: "var(--text-3)"
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ti ti-upload",
    style: {
      fontSize: 18
    }
  }), /*#__PURE__*/React.createElement("br", null), "Drop a logo here")), /*#__PURE__*/React.createElement(Field, {
    label: "Primary color"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      paddingTop: 4
    }
  }, ["#12796A", "#1F3A5F", "#5B3A8C", "#9C3F38"].map(c => /*#__PURE__*/React.createElement("span", {
    key: c,
    onClick: () => setBrand(c),
    style: {
      width: 32,
      height: 32,
      borderRadius: 8,
      background: c,
      cursor: "pointer",
      boxShadow: brand === c ? "0 0 0 2px var(--surface-card), 0 0 0 4px " + c : "none"
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary"
  }, "Publish theme"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost"
  }, "Reset to default"))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-panel)",
      border: "1px solid var(--border-1)",
      borderRadius: 12,
      padding: 16,
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 500,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: "var(--text-3)"
    }
  }, "Live preview"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-1)",
      borderRadius: 10,
      padding: 14,
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 500,
      color: brand
    }
  }, "NorthPeak Insurance"), /*#__PURE__*/React.createElement("button", {
    style: {
      border: "none",
      borderRadius: 8,
      padding: "8px 14px",
      fontSize: 13,
      fontWeight: 500,
      fontFamily: "var(--font-sans)",
      color: "#fff",
      background: brand,
      cursor: "pointer",
      alignSelf: "flex-start"
    }
  }, "Create quote"), /*#__PURE__*/React.createElement("span", {
    style: {
      alignSelf: "flex-start",
      fontSize: 11,
      fontWeight: 500,
      padding: "2px 10px",
      borderRadius: 999,
      background: brand + "1A",
      color: brand
    }
  }, "Active policy")), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, "Emails and PDF documents restyle from the same tokens."))))));
}
window.SettingsScreen = SettingsScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/insurimple_app/Settings.jsx", error: String((e && e.message) || e) }); }

// ui_kits/insurimple_app/Softphone.jsx
try { (() => {
function Softphone({
  phase,
  onPhase,
  onOpenContact,
  known
}) {
  // phase: idle | ringing | incall | wrapup | hidden
  if (phase === "hidden") return null;
  const caller = known ? {
    name: "Priya Sharma",
    sub: "(416) 555-0182 · Active client"
  } : {
    name: "Unknown caller",
    sub: "(647) 555-0011 · no match"
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      right: 20,
      bottom: 20,
      zIndex: 200,
      width: 300,
      background: "var(--surface-popover)",
      borderRadius: 12,
      boxShadow: "var(--shadow-overlay)",
      border: "1px solid var(--border-1)",
      fontFamily: "var(--font-sans)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "8px 14px",
      background: phase === "ringing" ? "var(--tenant-primary)" : "var(--surface-panel)",
      color: phase === "ringing" ? "#fff" : "var(--text-2)",
      fontSize: 12,
      fontWeight: 500,
      display: "flex",
      alignItems: "center",
      gap: 8,
      borderBottom: "1px solid var(--border-1)"
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: `ti ti-${phase === "ringing" ? "phone-incoming" : phase === "incall" ? "phone-call" : phase === "wrapup" ? "notes" : "phone"}`,
    style: {
      fontSize: 15
    }
  }), phase === "idle" ? "Softphone — ready" : phase === "ringing" ? "Incoming call" : phase === "incall" ? "On call · 02:14" : "Wrap-up", /*#__PURE__*/React.createElement("i", {
    className: "ti ti-x",
    onClick: () => onPhase("hidden"),
    style: {
      marginLeft: "auto",
      cursor: "pointer",
      fontSize: 14
    }
  })), phase === "idle" ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 14,
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Input, {
    size: "sm",
    icon: "phone",
    placeholder: "Type a number or name"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "sm",
    icon: "phone-outgoing",
    style: {
      flex: 1
    },
    onClick: () => onPhase("incall")
  }, "Call"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm",
    icon: "phone-incoming",
    onClick: () => onPhase("ringing")
  }, "Simulate ring")), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, "Line: (416) 555-0100 \xB7 recording per tenant policy")) : phase === "ringing" ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 14,
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: known ? caller.name : "?",
    size: "lg"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 500,
      color: "var(--text-1)"
    }
  }, caller.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-2)"
    }
  }, caller.sub), known ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, "Open application: TXN-118") : null)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      padding: "0 14px 14px"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    icon: "phone",
    style: {
      flex: 1
    },
    onClick: () => onPhase("incall")
  }, "Answer"), /*#__PURE__*/React.createElement(IconButton, {
    icon: "phone-off",
    label: "Decline",
    variant: "outline",
    onClick: () => onPhase("idle")
  }))) : phase === "incall" ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 14,
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: known ? caller.name : "?",
    size: "lg"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 500,
      color: "var(--text-1)"
    }
  }, caller.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-2)"
    }
  }, caller.sub))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      padding: "0 14px 10px"
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "microphone-off",
    label: "Mute",
    variant: "outline"
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: "player-pause",
    label: "Hold",
    variant: "outline"
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: "arrows-transfer-up",
    label: "Transfer",
    variant: "outline"
  }), known ? /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm",
    style: {
      marginLeft: "auto"
    },
    onClick: onOpenContact
  }, "Open record") : null), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "0 14px 14px"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "danger",
    icon: "phone-off",
    style: {
      width: "100%"
    },
    onClick: () => onPhase("wrapup")
  }, "End call"))) : /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 14,
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-2)"
    }
  }, "Call with ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: "var(--text-1)",
      fontWeight: 500
    }
  }, caller.name), " \xB7 02:14"), /*#__PURE__*/React.createElement(Field, {
    label: "Outcome"
  }, /*#__PURE__*/React.createElement(Select, {
    defaultValue: ""
  }, /*#__PURE__*/React.createElement("option", {
    value: "",
    disabled: true
  }, "Pick one\u2026"), /*#__PURE__*/React.createElement("option", null, "Reached \u2014 follow-up booked"), /*#__PURE__*/React.createElement("option", null, "Reached \u2014 no action"), /*#__PURE__*/React.createElement("option", null, "Voicemail"), /*#__PURE__*/React.createElement("option", null, "Wrong number"))), /*#__PURE__*/React.createElement(Field, {
    label: "Notes"
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "What happened, what's next"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "sm",
    style: {
      flex: 1
    },
    onClick: () => onPhase("idle")
  }, "Save & close"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm",
    onClick: () => onPhase("idle")
  }, "Skip"))));
}
function CreatePartyPop({
  open,
  onClose,
  onCreate
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      right: 336,
      bottom: 20,
      zIndex: 199,
      width: 340,
      background: "var(--surface-popover)",
      borderRadius: 12,
      boxShadow: "var(--shadow-overlay)",
      border: "1px solid var(--border-1)",
      fontFamily: "var(--font-sans)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "10px 14px",
      borderBottom: "1px solid var(--border-1)",
      fontSize: 13,
      fontWeight: 500,
      color: "var(--text-1)",
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ti ti-user-plus",
    style: {
      color: "var(--tenant-primary)",
      fontSize: 16
    }
  }), "No match for (647) 555-0011 \u2014 create a party?"), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 14,
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "First name"
  }, /*#__PURE__*/React.createElement(Input, {
    size: "sm",
    placeholder: "First"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Last name"
  }, /*#__PURE__*/React.createElement(Input, {
    size: "sm",
    placeholder: "Last"
  }))), /*#__PURE__*/React.createElement(Field, {
    label: "Phone"
  }, /*#__PURE__*/React.createElement(Input, {
    size: "sm",
    defaultValue: "(647) 555-0011"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "sm",
    style: {
      flex: 1
    },
    onClick: onCreate
  }, "Create & open"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm",
    onClick: onClose
  }, "Not now"))));
}
const CALLS = [{
  dir: "in",
  who: "Priya Sharma",
  num: "(416) 555-0182",
  when: "10:32",
  len: "6:12",
  outcome: "Reached — follow-up booked",
  by: "GK"
}, {
  dir: "out",
  who: "Wei Chen",
  num: "(604) 555-0126",
  when: "10:05",
  len: "2:41",
  outcome: "Voicemail",
  by: "GK"
}, {
  dir: "in",
  who: "Unknown → Dana Wilson",
  num: "(647) 555-0011",
  when: "09:48",
  len: "4:03",
  outcome: "New party created",
  by: "MN"
}, {
  dir: "out",
  who: "Jean Tremblay",
  num: "(514) 555-0147",
  when: "09:20",
  len: "8:55",
  outcome: "Reached — quote explained",
  by: "GK"
}, {
  dir: "in",
  who: "Rosa Martinez",
  num: "(905) 555-0192",
  when: "Yesterday",
  len: "3:17",
  outcome: "Service request opened",
  by: "TK"
}];
function CallLog({
  onOpenContact
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24,
      display: "flex",
      flexDirection: "column",
      gap: 14,
      maxWidth: 950
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontSize: 22,
      fontWeight: 500,
      color: "var(--text-1)"
    }
  }, "Calls"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--text-3)"
    }
  }, "Today: 23 \xB7 avg 4:10"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      fontSize: 12,
      color: "var(--text-3)",
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ti ti-record-mail",
    style: {
      fontSize: 15
    }
  }), "Recording on \u2014 consent line plays first")), /*#__PURE__*/React.createElement(Table, {
    columns: [{
      header: "",
      render: r => /*#__PURE__*/React.createElement("i", {
        className: `ti ti-phone-${r.dir === "in" ? "incoming" : "outgoing"}`,
        style: {
          fontSize: 16,
          color: r.dir === "in" ? "var(--tenant-primary)" : "var(--text-3)"
        }
      })
    }, {
      header: "Contact",
      render: r => /*#__PURE__*/React.createElement("span", {
        style: {
          fontWeight: 500
        }
      }, r.who)
    }, {
      header: "Number",
      key: "num"
    }, {
      header: "Outcome",
      key: "outcome"
    }, {
      header: "By",
      render: r => /*#__PURE__*/React.createElement(Avatar, {
        name: r.by,
        size: "sm"
      })
    }, {
      header: "Length",
      key: "len",
      align: "right"
    }, {
      header: "When",
      key: "when",
      align: "right"
    }],
    rows: CALLS,
    onRowClick: () => onOpenContact()
  }));
}
Object.assign(window, {
  Softphone,
  CreatePartyPop,
  CallLog
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/insurimple_app/Softphone.jsx", error: String((e && e.message) || e) }); }

// ui_kits/rate_family/Landing.jsx
try { (() => {
const VERTICALS = [{
  key: "top",
  label: "TopRates.ca",
  icon: "star"
}, {
  key: "life",
  label: "LifeRate.ca",
  icon: "heart"
}, {
  key: "term",
  label: "TermRates.ca",
  icon: "hourglass"
}, {
  key: "health",
  label: "HealthRate.ca",
  icon: "first-aid-kit"
}];
function RFHeader({
  vertical,
  onVertical
}) {
  const v = VERTICALS.find(x => x.key === vertical);
  return /*#__PURE__*/React.createElement("header", {
    style: {
      background: "var(--surface-card)",
      borderBottom: "1px solid var(--border-1)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "6px 24px",
      borderBottom: "1px solid var(--border-1)",
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      marginRight: 6
    }
  }, "A Rate Family site:"), VERTICALS.map(x => /*#__PURE__*/React.createElement("a", {
    key: x.key,
    onClick: () => onVertical(x.key),
    style: {
      cursor: "pointer",
      padding: "2px 10px",
      borderRadius: 999,
      textDecoration: "none",
      fontWeight: x.key === vertical ? 500 : 400,
      color: x.key === vertical ? "var(--tenant-primary-deep)" : "var(--text-3)",
      background: x.key === vertical ? "var(--tenant-primary-tint)" : "transparent"
    }
  }, x.label))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 24,
      padding: "14px 24px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontSize: 20,
      fontWeight: 500,
      color: "var(--tenant-primary-deep)"
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: `ti ti-${v.icon}`,
    style: {
      fontSize: 22,
      color: "var(--tenant-primary)"
    }
  }), v.label), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: "flex",
      gap: 18,
      fontSize: 14
    }
  }, ["Compare rates", "Guides", "How we make money"].map(l => /*#__PURE__*/React.createElement("a", {
    key: l,
    style: {
      color: "var(--text-2)",
      textDecoration: "none",
      cursor: "pointer"
    }
  }, l))), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      display: "flex",
      gap: 14,
      alignItems: "center",
      fontSize: 14
    }
  }, /*#__PURE__*/React.createElement("a", {
    style: {
      color: "var(--text-2)",
      cursor: "pointer"
    }
  }, "FR"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm",
    icon: "phone"
  }, "Talk to an advisor"))));
}
function Landing({
  vertical,
  onVertical,
  onStart
}) {
  return /*#__PURE__*/React.createElement("div", {
    "data-vertical": vertical,
    style: {
      background: "var(--surface-page)",
      minHeight: "100vh",
      fontFamily: "var(--font-sans)"
    }
  }, /*#__PURE__*/React.createElement(RFHeader, {
    vertical: vertical,
    onVertical: onVertical
  }), /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 1000,
      margin: "0 auto",
      padding: "56px 24px 40px",
      display: "grid",
      gridTemplateColumns: "1.2fr 1fr",
      gap: 40,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontSize: 34,
      fontWeight: 500,
      letterSpacing: "-0.01em",
      lineHeight: 1.25,
      color: "var(--text-1)"
    }
  }, "Compare life insurance rates from 12 Canadian insurers"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "14px 0 0",
      fontSize: 16,
      color: "var(--text-2)",
      maxWidth: 460
    }
  }, "Answer four questions, see real monthly prices. No phone number needed to look. New to Canada? We'll explain every term as we go."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      marginTop: 22,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "accent",
    size: "lg",
    icon: "arrow-right",
    onClick: onStart
  }, "Find your rate"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--text-3)"
    }
  }, "Takes about 2 minutes")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 18,
      marginTop: 26,
      fontSize: 13,
      color: "var(--text-2)"
    }
  }, ["Licensed advisors", "No spam calls", "Data stays in Canada"].map(t => /*#__PURE__*/React.createElement("span", {
    key: t,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ti ti-circle-check",
    style: {
      color: "var(--tenant-primary)",
      fontSize: 16
    }
  }), t)))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      border: "1px dashed var(--border-2)",
      borderRadius: 12,
      height: 260,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      color: "var(--text-3)",
      fontSize: 13,
      textAlign: "center",
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ti ti-photo",
    style: {
      fontSize: 28
    }
  }), "Bo the beaver hero illustration", /*#__PURE__*/React.createElement("br", null), "(artwork not yet provided \u2014 placeholder)")), /*#__PURE__*/React.createElement("section", {
    style: {
      background: "var(--surface-card)",
      borderTop: "1px solid var(--border-1)",
      borderBottom: "1px solid var(--border-1)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1000,
      margin: "0 auto",
      padding: "28px 24px",
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 12
    }
  }, [["heart", "Life", "From $18/mo"], ["hourglass", "Term", "From $14/mo"], ["first-aid-kit", "Health", "From $42/mo"], ["passport", "Super Visa", "From $96/mo"]].map(([ic, t, p]) => /*#__PURE__*/React.createElement("a", {
    key: t,
    onClick: onStart,
    style: {
      cursor: "pointer",
      textDecoration: "none",
      display: "flex",
      flexDirection: "column",
      gap: 4,
      padding: 16,
      borderRadius: 12,
      border: "1px solid var(--border-1)",
      background: "var(--surface-page)"
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: `ti ti-${ic}`,
    style: {
      fontSize: 22,
      color: "var(--tenant-primary)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 500,
      color: "var(--text-1)"
    }
  }, t), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--text-2)"
    }
  }, p))))), /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 1000,
      margin: "0 auto",
      padding: "36px 24px 56px",
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-1)",
      borderRadius: 12,
      padding: 20
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: "var(--font-serif)",
      fontSize: 19,
      lineHeight: 1.5,
      color: "var(--text-1)"
    }
  }, "\"What's a beneficiary? What's underwriting? Our guides define every term \u2014 because you shouldn't need a glossary to protect your family.\""), /*#__PURE__*/React.createElement("a", {
    style: {
      display: "inline-block",
      marginTop: 10,
      fontSize: 14,
      fontWeight: 500,
      color: "var(--tenant-primary)",
      cursor: "pointer"
    }
  }, "Read the newcomer's guide to life insurance \u2192")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--tenant-primary-tint)",
      borderRadius: 12,
      padding: 20
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: 18,
      fontWeight: 500,
      color: "var(--text-1)"
    }
  }, "How we make money"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "8px 0 0",
      fontSize: 14,
      color: "var(--text-2)",
      lineHeight: 1.55
    }
  }, "Insurers pay us a commission when you buy through us. It never changes your price, and it never changes what we show you \u2014 rates are sorted by price, not by what we earn."), /*#__PURE__*/React.createElement("a", {
    style: {
      display: "inline-block",
      marginTop: 10,
      fontSize: 14,
      fontWeight: 500,
      color: "var(--tenant-primary-deep)",
      cursor: "pointer"
    }
  }, "Our methodology \u2192"))), /*#__PURE__*/React.createElement("footer", {
    style: {
      background: "var(--ink)",
      color: "#B8C2C6",
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1000,
      margin: "0 auto",
      padding: "20px 24px",
      display: "flex",
      gap: 20,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 500,
      color: "#fff"
    }
  }, "Rate Family"), /*#__PURE__*/React.createElement("span", null, "Operated by Webhub4u \xB7 Advice by KLC Group (licensed)"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto"
    }
  }, "Privacy \xB7 Terms \xB7 Accessibility"))));
}
Object.assign(window, {
  Landing,
  RFHeader
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/rate_family/Landing.jsx", error: String((e && e.message) || e) }); }

// ui_kits/rate_family/Quoter.jsx
try { (() => {
const STEPS = ["About you", "Coverage", "Health", "Your rates"];
function Progress({
  step
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, STEPS.map((s, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: s
  }, i > 0 ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: 28,
      height: 2,
      background: i <= step ? "var(--tenant-primary)" : "var(--border-1)"
    }
  }) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontSize: 13,
      fontWeight: i === step ? 500 : 400,
      color: i === step ? "var(--text-1)" : i < step ? "var(--tenant-primary-deep)" : "var(--text-3)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 20,
      height: 20,
      borderRadius: "50%",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 11,
      background: i < step ? "var(--tenant-primary)" : i === step ? "var(--tenant-primary-tint)" : "var(--surface-sunken)",
      color: i < step ? "#fff" : i === step ? "var(--tenant-primary-deep)" : "var(--text-3)"
    }
  }, i < step ? /*#__PURE__*/React.createElement("i", {
    className: "ti ti-check"
  }) : i + 1), s))));
}
function Quoter({
  vertical,
  onVertical,
  onHome
}) {
  const [step, setStep] = React.useState(0);
  const [smoker, setSmoker] = React.useState("no");
  const [term, setTerm] = React.useState(20);
  const [sort, setSort] = React.useState("price");
  const rates = [{
    insurer: "Maple Mutual",
    rating: "A+",
    price: "$21.60",
    note: "Best price"
  }, {
    insurer: "True North Life",
    rating: "A",
    price: "$23.10",
    note: "Fastest approval"
  }, {
    insurer: "Laurentide Assurance",
    rating: "A+",
    price: "$24.85",
    note: ""
  }, {
    insurer: "Pacific & Prairie",
    rating: "A−",
    price: "$26.30",
    note: "No medical exam"
  }];
  return /*#__PURE__*/React.createElement("div", {
    "data-vertical": vertical,
    style: {
      background: "var(--surface-page)",
      minHeight: "100vh",
      fontFamily: "var(--font-sans)"
    }
  }, /*#__PURE__*/React.createElement(RFHeader, {
    vertical: vertical,
    onVertical: onVertical
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 760,
      margin: "0 auto",
      padding: "36px 24px"
    }
  }, /*#__PURE__*/React.createElement("a", {
    onClick: onHome,
    style: {
      fontSize: 13,
      color: "var(--text-3)",
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ti ti-arrow-left"
  }), "Back to LifeRate.ca"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement(Progress, {
    step: step
  })), step < 3 ? /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-1)",
      borderRadius: 12,
      padding: 24,
      display: "flex",
      flexDirection: "column",
      gap: 18
    }
  }, step === 0 ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontSize: 22,
      fontWeight: 500,
      color: "var(--text-1)"
    }
  }, "First, a bit about you"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Date of birth",
    help: "We use this to match rates \u2014 it never affects your credit."
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "1990-04-12",
    icon: "calendar"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Postal code"
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "M5V 2T6"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Province"
  }, /*#__PURE__*/React.createElement(Select, {
    defaultValue: "ON"
  }, /*#__PURE__*/React.createElement("option", {
    value: "ON"
  }, "Ontario"), /*#__PURE__*/React.createElement("option", {
    value: "BC"
  }, "British Columbia"), /*#__PURE__*/React.createElement("option", {
    value: "QC"
  }, "Quebec"), /*#__PURE__*/React.createElement("option", {
    value: "AB"
  }, "Alberta"))), /*#__PURE__*/React.createElement(Field, {
    label: "Do you smoke?",
    help: "Includes vaping. Insurers count anything in the last 12 months."
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 16,
      paddingTop: 8
    }
  }, /*#__PURE__*/React.createElement(Radio, {
    label: "No",
    checked: smoker === "no",
    onChange: () => setSmoker("no")
  }), /*#__PURE__*/React.createElement(Radio, {
    label: "Yes",
    checked: smoker === "yes",
    onChange: () => setSmoker("yes")
  }))))) : step === 1 ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontSize: 22,
      fontWeight: 500,
      color: "var(--text-1)"
    }
  }, "How much coverage?"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "-8px 0 0",
      fontSize: 14,
      color: "var(--text-2)"
    }
  }, "Term = coverage for a set number of years. Most families pick 10\xD7 their yearly income."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Coverage amount"
  }, /*#__PURE__*/React.createElement(Select, {
    defaultValue: "500"
  }, /*#__PURE__*/React.createElement("option", {
    value: "250"
  }, "$250,000"), /*#__PURE__*/React.createElement("option", {
    value: "500"
  }, "$500,000"), /*#__PURE__*/React.createElement("option", {
    value: "750"
  }, "$750,000"), /*#__PURE__*/React.createElement("option", {
    value: "1000"
  }, "$1,000,000"))), /*#__PURE__*/React.createElement(Field, {
    label: "Term length"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      paddingTop: 4
    }
  }, [10, 20, 30].map(t => /*#__PURE__*/React.createElement(Chip, {
    key: t,
    selected: term === t,
    onClick: () => setTerm(t)
  }, t, " years")))))) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontSize: 22,
      fontWeight: 500,
      color: "var(--text-1)"
    }
  }, "Two quick health questions"), /*#__PURE__*/React.createElement(Checkbox, {
    label: "I've been diagnosed with a serious condition in the last 5 years"
  }), /*#__PURE__*/React.createElement(Checkbox, {
    label: "A doctor has advised me to have tests or surgery I haven't completed"
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 13,
      color: "var(--text-3)"
    }
  }, "Answering yes doesn't disqualify you \u2014 it helps us show insurers who'll actually approve you.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      justifyContent: "flex-end",
      borderTop: "1px solid var(--border-1)",
      paddingTop: 16
    }
  }, step > 0 ? /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    onClick: () => setStep(step - 1)
  }, "Back") : null, /*#__PURE__*/React.createElement(Button, {
    variant: "accent",
    icon: "arrow-right",
    onClick: () => setStep(step + 1)
  }, step === 2 ? "See my rates" : "Continue"))) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontSize: 22,
      fontWeight: 500,
      color: "var(--text-1)"
    }
  }, "Your rates \u2014 $500,000 \xB7 ", term, "-year term"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      fontSize: 13,
      color: "var(--text-3)"
    }
  }, "Sort by"), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 130
    }
  }, /*#__PURE__*/React.createElement(Select, {
    size: "sm",
    value: sort,
    onChange: e => setSort(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "price"
  }, "Price"), /*#__PURE__*/React.createElement("option", {
    value: "rating"
  }, "Rating")))), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "-6px 0 4px",
      fontSize: 13,
      color: "var(--text-2)"
    }
  }, "Sorted by price, not by what we earn. ", /*#__PURE__*/React.createElement("a", {
    style: {
      cursor: "pointer"
    }
  }, "How we make money")), rates.map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: r.insurer,
    style: {
      background: "var(--surface-card)",
      border: `1px solid ${i === 0 ? "var(--tenant-primary)" : "var(--border-1)"}`,
      borderRadius: 12,
      padding: "16px 20px",
      display: "flex",
      alignItems: "center",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 44,
      height: 44,
      borderRadius: 8,
      background: "var(--surface-sunken)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 11,
      color: "var(--text-3)",
      textAlign: "center",
      flex: "none"
    }
  }, "logo"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16,
      fontWeight: 500,
      color: "var(--text-1)"
    }
  }, r.insurer), r.note ? /*#__PURE__*/React.createElement(Badge, {
    tone: i === 0 ? "accent" : "neutral"
  }, r.note) : null), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--text-2)"
    }
  }, "Financial strength ", r.rating, " \xB7 30-day free look")), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "right"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 24,
      fontWeight: 500,
      color: "var(--text-1)",
      fontVariantNumeric: "tabular-nums"
    }
  }, r.price, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--text-3)",
      fontWeight: 400
    }
  }, "/mo"))), /*#__PURE__*/React.createElement(Button, {
    variant: i === 0 ? "accent" : "secondary"
  }, "Get this rate"))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--tenant-primary-tint)",
      borderRadius: 12,
      padding: 16,
      display: "flex",
      alignItems: "center",
      gap: 12,
      fontSize: 14,
      color: "var(--text-1)"
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ti ti-headset",
    style: {
      fontSize: 22,
      color: "var(--tenant-primary)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Not sure which to pick? A licensed KLC advisor can walk you through it \u2014 no pressure, no obligation."), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "sm",
    icon: "phone"
  }, "Book a call")))));
}
window.Quoter = Quoter;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/rate_family/Quoter.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Chip = __ds_scope.Chip;

__ds_ns.ListRow = __ds_scope.ListRow;

__ds_ns.MetricCard = __ds_scope.MetricCard;

__ds_ns.Table = __ds_scope.Table;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.Spinner = __ds_scope.Spinner;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Field = __ds_scope.Field;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Drawer = __ds_scope.Drawer;

__ds_ns.Modal = __ds_scope.Modal;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.Toast = __ds_scope.Toast;

})();
