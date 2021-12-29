function getDisplayName(uuid, globalState) {
  return globalState.find(globalState, uuid).name;
}
export default getDisplayName;