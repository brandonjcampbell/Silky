const actorToCyto = (actors) => {
  let newActors = actors.map((x) => {
    let result = {};
    if (x.class === "actor") {
      result = {
        data: { id: `${x.uuid}`, label: x.name, hyper: 0 },
      };
    }
    return result;
  });
  return [...newActors];
};

export default actorToCyto;