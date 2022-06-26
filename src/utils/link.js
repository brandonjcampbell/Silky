
function link(subjectUuid, targetUuid, type, dispatch, callback) {
  dispatch({
    action: "add",
    for: "link",
    payload: { name:type, subjects:[subjectUuid], targets:[targetUuid], callback:callback},
  });
}

  export default link;