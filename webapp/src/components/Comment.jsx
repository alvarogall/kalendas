const Comment = ({ comment, onRemoveComment }) => {
  const commentStyle = {
    padding: 5,
    border: '1px dashed gray',
    marginBottom: 2,
    fontSize: '0.9em'
  }

  return (
    <div style={commentStyle}>
      <strong>{comment.user}:</strong> {comment.text}
      <br/>
      <small>{new Date(comment.createdAt).toLocaleString()}</small>
      {typeof onRemoveComment === 'function' && (
        <button onClick={onRemoveComment} style={{ marginLeft: 10, fontSize: '0.8em' }}>delete</button>
      )}
    </div>
  )
}

export default Comment