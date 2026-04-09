import VariantButton from './VariantButton'


const ButtonVariantsDemo = () => (
  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
    <VariantButton variant="default" />
    <VariantButton variant="outline" />
    <VariantButton variant="ghost" />
    <VariantButton variant="soft" />
  </div>
)


export default ButtonVariantsDemo
