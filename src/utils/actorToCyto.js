const actorToCyto = (actors)=>{
  let axioms =[]
  let newActors = actors.map(x=>{
        let result = {}
       
        if(x.class==="actor"){
     
          result={
              
              data: { id:`${x.uuid}`, label: x.name, hyper:0 }
            }
          }
    
        else if(x.class==="axiom"){
          result ={
              data: {  id:`${x.uuid}`, label: x.name ,hyper:1, color:x.color} //globalState.getDisplayName(globalState,x) }
          }
          axioms.push({data:
           {
              id:`from${x.uuid}`,
              target:`${x.uuid}`,
              source:`${x.subject}`,
              "arrow": "circle",
              label:"link"
          }})
    
          axioms.push({data: 
            
            {
               id:`to${x.uuid}`,
               source:`${x.uuid}`,
               target:`${x.target}`,
               "arrow": "triangle",
              label:"link"
           }})
        }
        return result
      })
      return [...newActors,...axioms]
}

export default actorToCyto;

