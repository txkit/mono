import VariantButton from './VariantButton'


const CompactVariantsDemo = () => (
  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
    <VariantButton size="compact" variant="default" />
    <VariantButton size="compact" variant="outline" />
    <VariantButton size="compact" variant="ghost" />
    <VariantButton size="compact" variant="soft" />
  </div>
)


export default CompactVariantsDemo
