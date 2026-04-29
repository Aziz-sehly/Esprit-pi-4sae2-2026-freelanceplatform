import {
  Injectable,
  setClassMetadata,
  ɵɵdefineInjectable
} from "./chunk-3NETAX32.js";

// node_modules/@angular/cdk/fesm2022/unique-selection-dispatcher-DtHZDqyJ.mjs
var UniqueSelectionDispatcher = class _UniqueSelectionDispatcher {
  _listeners = [];
  /**
   * Notify other items that selection for the given name has been set.
   * @param id ID of the item.
   * @param name Name of the item.
   */
  notify(id, name) {
    for (let listener of this._listeners) {
      listener(id, name);
    }
  }
  /**
   * Listen for future changes to item selection.
   * @return Function used to deregister listener
   */
  listen(listener) {
    this._listeners.push(listener);
    return () => {
      this._listeners = this._listeners.filter((registered) => {
        return listener !== registered;
      });
    };
  }
  ngOnDestroy() {
    this._listeners = [];
  }
  static ɵfac = function UniqueSelectionDispatcher_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _UniqueSelectionDispatcher)();
  };
  static ɵprov = ɵɵdefineInjectable({
    token: _UniqueSelectionDispatcher,
    factory: _UniqueSelectionDispatcher.ɵfac,
    providedIn: "root"
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(UniqueSelectionDispatcher, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], null, null);
})();

export {
  UniqueSelectionDispatcher
};
//# sourceMappingURL=chunk-S2PGOVHF.js.map
