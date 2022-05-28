function getDisplayName(uuid, globalState) {
  const result = globalState.find(globalState, uuid);
  if (result) {
    return result.name;
  } else {
    return null;
  }
}
export default getDisplayName;
