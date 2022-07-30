export const getListStyle = (
  isDraggingOver: boolean,
  participantsLength = 1,
) => ({
  background: isDraggingOver
    ? '#D1FBF1'
    : participantsLength > 0
    ? 'transparent'
    : '#EFF3F5',
  margin: '8px 0',
  display: 'flex',
  flexWrap: 'wrap',
  padding: participantsLength > 0 ? 8 : 0,
  overflow: 'auto',
  height: 68,
  border: `1px ${isDraggingOver ? 'dashed' : 'solid'} #C8D1DC`,
  borderRadius: '8px',
});
