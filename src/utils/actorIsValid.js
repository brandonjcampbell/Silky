function actorIsValid (globalState,testId){
    if(globalState.state.actors.find(x=>x.uuid===testId)){
    return true
    }
    else return false
  }

  export default actorIsValid;