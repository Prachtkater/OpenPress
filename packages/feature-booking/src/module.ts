import {
  defineNuxtModule,
  createResolver,
  addComponentsDir,
} from "@nuxt/kit";

export interface BookingModuleOptions {
  /** Directory for booking data, relative to content dir. Default: 'bookings' */
  bookingSubdir: string;
}

export default defineNuxtModule<BookingModuleOptions>({
  meta: {
    name: "@openpress/feature-booking",
    configKey: "openpressBooking",
    compatibility: { nuxt: ">=3.10.0", bridge: false },
  },
  defaults: {
    bookingSubdir: "bookings",
  },
  async setup(_options, nuxt) {
    const resolver = createResolver(import.meta.url);

    // Register OpBooking block component
    addComponentsDir({
      path: resolver.resolve("./runtime/components"),
      prefix: "Op",
      global: true,
    });

    // Inject booking config into runtime config
    (nuxt.options.runtimeConfig as Record<string, unknown>).openpressBooking = {
      bookingSubdir: _options.bookingSubdir,
    };
  },
});
