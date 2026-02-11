<script setup lang="ts">
import { useOpBlockClasses } from '@openpress/ui'
import { useContactForm } from '../composables/useContactForm'
import { ContactFormPropsSchema } from '../../schema'
import type { ContactFormProps, ContactField } from '../../schema'

const props = defineProps<{
  /** Block-Props aus dem CMS */
  block: {
    id: string
    type: string
    props: Record<string, unknown>
  }
}>()

// Props validieren und Defaults anwenden
const formProps = ContactFormPropsSchema.parse(props.block.props) as ContactFormProps

// Theme-Klassen auflösen
const classes = useOpBlockClasses('contact-form')

// Formular-Logik
const {
  formData,
  errors,
  submitting,
  submitted,
  submitError,
  validateField,
  submit,
} = useContactForm(formProps)

function getInputType(field: ContactField): string {
  switch (field.type) {
    case 'email': return 'email'
    case 'phone': return 'tel'
    default: return 'text'
  }
}

function onBlur(fieldName: string) {
  validateField(fieldName)
}

function onSubmit(e: Event) {
  e.preventDefault()
  submit()
}
</script>

<template>
  <div
    :class="classes.root"
    :data-op-block="block.id"
    data-op-block-type="contact-form"
  >
    <!-- Erfolgs-Meldung -->
    <div v-if="submitted" :class="classes.success">
      <p>{{ formProps.successMessage }}</p>
    </div>

    <!-- Formular -->
    <form v-else :class="classes.form" @submit="onSubmit">
      <!-- Honeypot (versteckt) -->
      <div aria-hidden="true" style="position:absolute;left:-9999px;top:-9999px">
        <label for="_hp_field">Nicht ausfüllen</label>
        <input id="_hp_field" type="text" name="_hp" tabindex="-1" autocomplete="off" />
      </div>

      <!-- Felder -->
      <div
        v-for="field in formProps.fields"
        :key="field.name"
        :class="classes.fieldGroup"
      >
        <label :for="`cf-${block.id}-${field.name}`" :class="classes.label">
          {{ field.label }}
          <span v-if="field.required" :class="classes.required">*</span>
        </label>

        <!-- Textarea -->
        <textarea
          v-if="field.type === 'textarea'"
          :id="`cf-${block.id}-${field.name}`"
          v-model="formData[field.name]"
          :name="field.name"
          :placeholder="field.placeholder"
          :required="field.required"
          :class="[classes.input, classes.textarea, errors[field.name] ? classes.inputError : '']"
          rows="4"
          @blur="onBlur(field.name)"
        />

        <!-- Select -->
        <select
          v-else-if="field.type === 'select'"
          :id="`cf-${block.id}-${field.name}`"
          v-model="formData[field.name]"
          :name="field.name"
          :required="field.required"
          :class="[classes.input, classes.select, errors[field.name] ? classes.inputError : '']"
          @blur="onBlur(field.name)"
        >
          <option value="" disabled>{{ field.placeholder || 'Bitte wählen' }}</option>
          <option v-for="opt in field.options" :key="opt" :value="opt">{{ opt }}</option>
        </select>

        <!-- Checkbox -->
        <div v-else-if="field.type === 'checkbox'" :class="classes.checkboxWrapper">
          <input
            :id="`cf-${block.id}-${field.name}`"
            v-model="formData[field.name]"
            type="checkbox"
            :name="field.name"
            :required="field.required"
            true-value="on"
            false-value=""
            :class="classes.checkbox"
            @blur="onBlur(field.name)"
          />
          <span :class="classes.checkboxLabel">{{ field.placeholder || field.label }}</span>
        </div>

        <!-- Text / Email / Phone -->
        <input
          v-else
          :id="`cf-${block.id}-${field.name}`"
          v-model="formData[field.name]"
          :type="getInputType(field)"
          :name="field.name"
          :placeholder="field.placeholder"
          :required="field.required"
          :class="[classes.input, errors[field.name] ? classes.inputError : '']"
          @blur="onBlur(field.name)"
        />

        <!-- Fehler -->
        <p v-if="errors[field.name]" :class="classes.error">
          {{ errors[field.name] }}
        </p>
      </div>

      <!-- Submit-Fehler -->
      <p v-if="submitError" :class="classes.submitError">
        {{ submitError }}
      </p>

      <!-- Submit-Button -->
      <button
        type="submit"
        :disabled="submitting"
        :class="classes.button"
      >
        <span v-if="submitting" :class="classes.spinner" />
        {{ submitting ? 'Senden...' : formProps.submitLabel }}
      </button>
    </form>
  </div>
</template>
