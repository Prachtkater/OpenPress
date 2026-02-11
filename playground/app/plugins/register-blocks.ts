import { registerBlock } from '@openpress/ui'
import BlockHeading from '../components/blocks/BlockHeading.vue'
import BlockParagraph from '../components/blocks/BlockParagraph.vue'
import BlockButton from '../components/blocks/BlockButton.vue'
import BlockFeatureCard from '../components/blocks/BlockFeatureCard.vue'
import BlockList from '../components/blocks/BlockList.vue'
import BlockTestimonial from '../components/blocks/BlockTestimonial.vue'
import BlockGeneric from '../components/blocks/BlockGeneric.vue'

export default defineNuxtPlugin(() => {
  const blocks: Record<string, unknown> = {
    'heading': BlockHeading,
    'paragraph': BlockParagraph,
    'button': BlockButton,
    'feature-card': BlockFeatureCard,
    'list': BlockList,
    'testimonial': BlockTestimonial,
  }

  for (const [type, component] of Object.entries(blocks)) {
    registerBlock(type, component as never)
  }

  // Register generic fallback for unregistered types
  const unregisteredTypes = [
    'value-card', 'team-member', 'project-card', 'stat',
    'contact-detail', 'contact-form',
  ]
  for (const type of unregisteredTypes) {
    registerBlock(type, BlockGeneric as never)
  }
})
