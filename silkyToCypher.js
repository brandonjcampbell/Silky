const silkyJson = require("./silkySample.json");
const neo4j = require("neo4j-driver");
const _ = require("lodash");

const actors = [];
const axioms = [];

const driver = neo4j.driver(
  "bolt://localhost:11003",
  neo4j.auth.basic("neo4j", "password")
);

function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

async function runAllQueries(queries) {
  for await (const batch of queries) {
    const session = driver.session();

    try {
      const result = await session.run(batch);
        console.log("operation successful ");
    } catch (error) {
      console.log("exception occurred", error);
      throw error;
    } finally {
      await session.close();
    }
  }
}

silkyJson.actors.forEach((actor) => {
  if (actor.type === "fact") {
    actors.push(`CREATE (:Fact {name:"${actor.name}", uuid:"${actor.uuid}"})`);
    if (actor.facts){
    actor.facts.forEach((fact) => {
        axioms.push(
          `MATCH (el {uuid:"${actor.uuid}"}), (fa {uuid:"${fact.uuid}"}) CREATE (fa)-[:DEPENDS_ON]->(el)`
        );
      });
    }
  }

  if (actor.type === "element") {
    actors.push(
      `CREATE (:Element {name:"${actor.name}", uuid:"${actor.uuid}"})`
    );
    actor.facts.forEach((fact) => {
      axioms.push(
        `MATCH (el {uuid:"${actor.uuid}"}), (fa {uuid:"${fact.uuid}"}) CREATE (fa)-[:INVOLVES]->(el)`
      );
    });
  }

  if (actor.type === "snippet") {
    actors.push(
      `CREATE (:Snippet {name:"${actor.name}", uuid:"${actor.uuid}"})`
    );
    actor.elements.forEach((element) => {
      axioms.push(
        `MATCH (sn {uuid:"${actor.uuid}"}), (el {uuid:"${element.uuid}"}) CREATE (el)-[:APPEARS_IN]->(sn)`
      );
    });
    if (actor.facts) {
      actor.facts.forEach((fact) => {
        axioms.push(
          `MATCH (sn {uuid:"${actor.uuid}"}), (fa {uuid:"${fact.uuid}"}) CREATE (sn)-[:REVEALS]->(fa)`
        );
      });
    }
  }

  if (actor.type === "thread") {
    actors.push(
      `CREATE (:Thread {name:"${actor.name}", uuid:"${actor.uuid}"})`
    );
    let prior = null;
    actor.sequence.forEach((snippet) => {
      if (prior === null) {
        axioms.push(
          `MATCH (th {uuid:"${actor.uuid}"}), (sn {uuid:"${snippet.uuid}"}) CREATE (th)-[:STARTS_WITH]->(sn)`
        );
      } else {
        axioms.push(
          `MATCH (sn1 {uuid:"${prior}"}), (sn2 {uuid:"${snippet.uuid}"}) CREATE (sn1)-[:THEN {name:"${actor.name}"}]->(sn2)`
        );
      }
      prior = snippet.uuid;
    });
  }
});

runAllQueries([...actors,...axioms]);





console.log("done");

// actors.forEach(actor=>

//     console.log(actor)

//     );
// console.log(" WITH 0 as o ")
// axioms.forEach(axiom=> console.log(axiom + " WITH 0 as o"));

// const actorString = actors.map(x=>x+ " ")

// actors.forEach(actor=> {
//     session.run(actor) ;
//     console.log(actor)
// }
//     );

// axioms.forEach(axiom=>
//     session.run(axiom)  ;
//     console.log(axiom)
//     );

driver.close();
