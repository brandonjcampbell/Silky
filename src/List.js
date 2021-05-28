import React, { useContext, useState } from 'react';
import { store } from './MyContext';
import TextField from '@material-ui/core/TextField';




const List = ({type}) => {
    const globalState = useContext(store);
    const { dispatch } = globalState;
    const content = globalState.state.actors
    const [name, setName] = useState("");

   const keyPress = (e)=>{
        if(e.keyCode == 13){
           console.log('value', e.target.value);
           dispatch({ action: 'add' , for:type, payload:{name:name}})
           setName("")
        }
     }

    return(
        <div style={{height:"100vh",width:"200px",color:"white",padding:"30px;"}}>
      
       <div> {type}
           <TextField style={{color:"white"}} id="outlined-basic" variant="outlined" value={name} onKeyDown={keyPress} onChange={(e)=>setName(e.target.value)}/> 
       </div>
              
                {content.map(x=> {
                    if(x.type===type)
                    return(
                    <div style={{margin:"10px"}}>
                        <button onClick={()=>dispatch({ action: 'remove' , for:type, payload:x.uuid})}>X</button>
                        {x.name} 
                    </div>
                    )
                    
                })}
        </div>
    )
}
export default List