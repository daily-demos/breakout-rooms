export const getListStyle = (isDraggingOver: boolean) => ({
  background: isDraggingOver ? 'lightblue' : '#F9FAFC',
  margin: '8px 0',
  display: 'flex',
  padding: 8,
  overflow: 'auto',
  height: 50,
});
