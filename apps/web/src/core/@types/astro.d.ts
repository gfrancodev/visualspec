/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    locale?: import("../i18n/types").Locale;
  }
}
