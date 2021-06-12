import React, { useContext, useState, useEffect} from 'react';
import { store } from './MyContext';
import TextField from '@material-ui/core/TextField';
import Workspace from './Workspace';

const ActorList = ({type}) => {
    const globalState = useContext(store);
    const { dispatch } = globalState;
    const content = globalState.state.actors
    const [name, setName] = useState("");
    const [active,setActive]= useState(null)
    const [count,setCount] = useState(1)

   const keyPress = (e)=>{
        if(e.keyCode === 13){
           dispatch({ action: 'add' , for:type, payload:{name:name}, class:"actor"})
           setName("")
        }
     }

     const handleRowClick = (row)=>{
        setActive(row)
    }

    // useEffect(() => {
    //     console.log(count)
    //     setCount(count+1)
    
           
    //      }, [active]);


    return(
        <div style={{display:"flex"}}>
            <div style={{height:"100vh",width:"500px",color:"white",padding:"30px;"}}>
      
                <div> {type}
                    <TextField style={{color:"white"}} id="outlined-basic" variant="outlined" value={name} onKeyDown={keyPress} onChange={(e)=>setName(e.target.value)}/> 
                </div>
                
                {content.map(x=> {
                    if(x.type===type)
                    return(
                    <div style={{margin:"10px"}} onClick={()=>{handleRowClick(x)}}>
                        <button onClick={()=>dispatch({ action: 'remove' , for:type, payload:x.uuid, class:"actor"})}>X</button>
                        {x.name} 
                    </div>
                    )
                })}
      
            </div>
                
            <div>
                {active && <Workspace actorUuid={active.uuid}></Workspace>}
            </div>
        </div>

    )
}
export default ActorList