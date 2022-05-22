const silkyJson = require("./silkySample.json");

const actors = [];
const axioms = [];

silkyJson.actors.forEach((actor) => {
  if (actor.type === "fact") {
    actors.push(`CREATE (:Fact {name:"${actor.name}", uuid:"${actor.uuid}"})`);
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

actors.forEach(actor=> console.log(actor));
console.log(" WITH 0 as o ")
axioms.forEach(axiom=> console.log(axiom + " WITH 0 as o"));
