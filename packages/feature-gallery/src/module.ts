import {
  defineNuxtModule,
  createResolver,
  addComponentsDir,
} from "@nuxt/kit";

export default defineNuxtModule({
  meta: {
    name: "@openpress/feature-gallery",
    configKey: "openpressGallery",
    compatibility: { nuxt: ">=3.10.0", bridge: false },
  },
  async setup(_options, _nuxt) {
    const resolver = createResolver(import.meta.url);

    addComponentsDir({
      path: resolver.resolve("./runtime/components"),
      prefix: "Op",
      global: true,
    });
  },
});
