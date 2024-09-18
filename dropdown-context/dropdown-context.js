import { useFloating } from "../floating.js";

document.addEventListener("alpine:init", () => {
  Alpine.data("dropdownContext", (opts = {}) => {
    return {
      isShow: false,
      floating: null,
      contextData: null,

      init() {
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
        ["x-show"]() {
          return this.isShow;
        },
        ["@open-contextmenu.window"]() {
          if (this.$event.detail.id !== this.$root.id) {
            return;
          }
          let mouseEvent = this.$event.detail.$event;
          this.floating.updateVirtualElement(mouseEvent);
          this.contextData = this.$event.detail.data;
          this.open();
        },
        ["x-ref"]: "menu",
        ["@click.outside"]() {
          this.close();
        },
      },
    };
  });
});
