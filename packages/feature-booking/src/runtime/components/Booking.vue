<script setup lang="ts">
/**
 * OpBooking block component.
 * Renders a date picker and available time slots for booking.
 * Styling is provided by the active theme (theme-agnostic).
 */
defineProps<{
  configId: string;
  heading?: string;
  description?: string;
}>();
</script>

<template>
  <div class="op-booking">
    <h3 v-if="heading">{{ heading }}</h3>
    <p v-if="description">{{ description }}</p>
    <div class="op-booking__calendar">
      <slot name="calendar">
        <!-- Theme provides calendar UI -->
        <p>Booking calendar for config: {{ configId }}</p>
      </slot>
    </div>
    <div class="op-booking__slots">
      <slot name="slots">
        <!-- Theme provides slot selection UI -->
      </slot>
    </div>
  </div>
</template>
