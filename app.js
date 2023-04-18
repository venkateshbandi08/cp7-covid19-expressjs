const express = require("express");
const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error ${e.message}`);
  }
};

initializeDBAndServer();

const returnListOfAllStates = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const returnEachDistrict = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

// 1 - Returns a list of all states in the state table
app.get("/states/", async (request, response) => {
  const getListOfAllStatesQuery = `
        SELECT * FROM state
        ORDER BY state_id;
    `;
  const allStatesArray = await db.all(getListOfAllStatesQuery);
  response.send(
    allStatesArray.map((eachState) => returnListOfAllStates(eachState))
  );
});

// 2 - Returns a state based on the state ID
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getAStateQuery = `
        SELECT * FROM state
        WHERE 
        state_id = ${stateId};
    `;
  const eachStateArray = await db.get(getAStateQuery);
  response.send(returnListOfAllStates(eachStateArray));
});

// 3 - Create a district in the district table, district_id is auto-incremented
app.post("/districts/", async (request, response) => {
  const districtsBody = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = districtsBody;
  const postDistrictQuery = `
    INSERT INTO
    district 
    (district_name, state_id, cases, cured, active, deaths)
    VALUES
    (
        '${districtName}',
        '${stateId}',
        '${cases}',
        '${cured}',
        '${active}',
        '${deaths}'
    )
  `;
  await db.run(postDistrictQuery);
  response.send("District Successfully Added");
});

// 4 - Returns a district based on the district ID
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getEachDistrictQuery = `
        SELECT * FROM district
        WHERE district_id = ${districtId};
    `;
  const eachDistrictArray = await db.get(getEachDistrictQuery);
  response.send(returnEachDistrict(eachDistrictArray));
});

// 5 - Deletes a district from the district table based on the district ID
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
        DELETE FROM district
        WHERE
        district_id = ${districtId};
    `;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

// 6 - Updates the details of a specific district based on the district ID
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const updateDistrictBody = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = updateDistrictBody;
  const updateDistrictQuery = `
        UPDATE district
        SET 
        district_name = '${districtName}',
        state_id = '${stateId}',
        cases = '${cases}',
        cured = '${cured}',
        active = '${active}',
        deaths = '${deaths}'
        WHERE 
        district_id = ${districtId};
    `;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

// 7 - Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStaticsQuery = `
        SELECT 
        SUM(cases) AS totalCases,
        SUM(cured) AS totalCured,
        SUM(active) AS totalActive,
        SUM(deaths) AS totalDeaths
        FROM district 
        NATURAL JOIN state
        WHERE state_id = ${stateId};
    `;
  const eachStateStatics = await db.get(getStateStaticsQuery);
  response.send(eachStateStatics);
});

// 8 - Returns an object containing the state name of a district based on the district ID
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateByDistrictQuery = `
        SELECT state_name AS stateName
        FROM state 
        NATURAL JOIN district
        WHERE district_id = ${districtId};
    `;
  const stateName = await db.get(getStateByDistrictQuery);
  response.send(stateName);
});

module.exports = app;
