document.addEventListener("alpine:init", () => {
  Alpine.data("dropdownContext", (props = {}, dataExtend = {}) => {
    let floatingUIoptions = ["placement", "offsetX", "offsetY", "flip", "autoPlacement", "inline"]

    let bind = {};
    ["menu"].forEach((i) => {
      if (dataExtend[i]) {
        bind[i] = dataExtend[i]
        delete dataExtend[i]
      }
    })

    return {
      isShow: false,
      floating: null,
      contextData: {},
      autoClose: props.autoClose ?? true,

      init() {
        let opts = floatingUIoptions.reduce((acc, i) => {
          if (props[i]) {
            return {
              ...acc,
              [i]: props[i],
            }
          }
          return acc
        }, {})
        this.$nextTick(() => {
          this.floating = useFloating(null, this.$refs.menu, opts);
        });
        Alpine.bind(this.$el, {
          ["@keydown.escape.window.prevent"]() {
            this.close();
          },
        });
      },
      open() {
        this.floating.startAutoUpdate();
        this.isShow = true;
      },
      close() {
        this.floating.destroy();
        this.isShow = false;
      },
      menu: {
        "x-show"() {
          return this.isShow;
        },
        "@open-contextmenu.window"() {
          if (this.$event.detail.id !== this.$root.id) {
            return;
          }
          let mouseEvent = this.$event.detail.$event;
          this.floating.updateVirtualElement(mouseEvent);
          this.contextData = this.$event.detail.data;
          this.open();
        },
        "x-ref": "menu",
        "@click.outside"() {
          this.close();
        },
        "@click"() {
          if (this.autoClose && this.$el.contains(this.$event.target)) {
            this.close()
          }
        },
        ...bind.menu,
      },
      ...dataExtend,
    };
  });
});
