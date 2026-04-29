import {
  MAT_SELECT_CONFIG,
  MAT_SELECT_SCROLL_STRATEGY,
  MAT_SELECT_SCROLL_STRATEGY_PROVIDER,
  MAT_SELECT_SCROLL_STRATEGY_PROVIDER_FACTORY,
  MAT_SELECT_TRIGGER,
  MatSelect,
  MatSelectChange,
  MatSelectModule,
  MatSelectTrigger
} from "./chunk-V7Y7ROL7.js";
import "./chunk-ANZZYYZQ.js";
import {
  MatOptgroup,
  MatOption
} from "./chunk-DUY4OGB5.js";
import "./chunk-R4QB32YE.js";
import "./chunk-ZFUTRHLA.js";
import "./chunk-YVBHOWN4.js";
import "./chunk-W7WYP3DM.js";
import "./chunk-X4OSQBHQ.js";
import "./chunk-KPVLZP37.js";
import {
  MatError,
  MatFormField,
  MatHint,
  MatLabel,
  MatPrefix,
  MatSuffix
} from "./chunk-F7BSCON5.js";
import "./chunk-WWPXCPVL.js";
import "./chunk-QCJPMRMV.js";
import "./chunk-JXBCBRYI.js";
import "./chunk-H2HINSTE.js";
import "./chunk-FMYN7BJT.js";
import "./chunk-JKRGDBZN.js";
import "./chunk-OARJ6C6K.js";
import "./chunk-5DOQBM3R.js";
import "./chunk-KQB4LJPA.js";
import "./chunk-QFZJVTC2.js";
import "./chunk-Q2EPOOQH.js";
import "./chunk-S2PGOVHF.js";
import "./chunk-SM7IIMX4.js";
import "./chunk-2O4WY5GE.js";
import "./chunk-4OXQ2ZRX.js";
import "./chunk-RCERMZUZ.js";
import "./chunk-XWJG3SIN.js";
import "./chunk-NNDYTQFX.js";
import "./chunk-63QKG2BI.js";
import "./chunk-R2B7T4EU.js";
import "./chunk-OPMNEA3F.js";
import "./chunk-3NETAX32.js";
import "./chunk-WPM5VTLQ.js";
import "./chunk-PEBH6BBU.js";
import "./chunk-4S3KYZTJ.js";
import "./chunk-3OV72XIM.js";

// node_modules/@angular/material/fesm2022/select.mjs
var matSelectAnimations = {
  // Represents
  // trigger('transformPanelWrap', [
  //   transition('* => void', query('@transformPanel', [animateChild()], {optional: true})),
  // ])
  /**
   * This animation ensures the select's overlay panel animation (transformPanel) is called when
   * closing the select.
   * This is needed due to https://github.com/angular/angular/issues/23302
   */
  transformPanelWrap: {
    type: 7,
    name: "transformPanelWrap",
    definitions: [{
      type: 1,
      expr: "* => void",
      animation: {
        type: 11,
        selector: "@transformPanel",
        animation: [{
          type: 9,
          options: null
        }],
        options: {
          optional: true
        }
      },
      options: null
    }],
    options: {}
  },
  // Represents
  // trigger('transformPanel', [
  //   state(
  //     'void',
  //     style({
  //       opacity: 0,
  //       transform: 'scale(1, 0.8)',
  //     }),
  //   ),
  //   transition(
  //     'void => showing',
  //     animate(
  //       '120ms cubic-bezier(0, 0, 0.2, 1)',
  //       style({
  //         opacity: 1,
  //         transform: 'scale(1, 1)',
  //       }),
  //     ),
  //   ),
  //   transition('* => void', animate('100ms linear', style({opacity: 0}))),
  // ])
  /** This animation transforms the select's overlay panel on and off the page. */
  transformPanel: {
    type: 7,
    name: "transformPanel",
    definitions: [{
      type: 0,
      name: "void",
      styles: {
        type: 6,
        styles: {
          opacity: 0,
          transform: "scale(1, 0.8)"
        },
        offset: null
      }
    }, {
      type: 1,
      expr: "void => showing",
      animation: {
        type: 4,
        styles: {
          type: 6,
          styles: {
            opacity: 1,
            transform: "scale(1, 1)"
          },
          offset: null
        },
        timings: "120ms cubic-bezier(0, 0, 0.2, 1)"
      },
      options: null
    }, {
      type: 1,
      expr: "* => void",
      animation: {
        type: 4,
        styles: {
          type: 6,
          styles: {
            opacity: 0
          },
          offset: null
        },
        timings: "100ms linear"
      },
      options: null
    }],
    options: {}
  }
};
export {
  MAT_SELECT_CONFIG,
  MAT_SELECT_SCROLL_STRATEGY,
  MAT_SELECT_SCROLL_STRATEGY_PROVIDER,
  MAT_SELECT_SCROLL_STRATEGY_PROVIDER_FACTORY,
  MAT_SELECT_TRIGGER,
  MatError,
  MatFormField,
  MatHint,
  MatLabel,
  MatOptgroup,
  MatOption,
  MatPrefix,
  MatSelect,
  MatSelectChange,
  MatSelectModule,
  MatSelectTrigger,
  MatSuffix,
  matSelectAnimations
};
//# sourceMappingURL=@angular_material_select.js.map
