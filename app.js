const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

const circulationRepo = require('./repos/circulationRepo');
const data = require('./circulation.json')

const url = 'mongodb://0.0.0.0:27017/';
const dbName = 'circulation';

async function main() {
    const client = new MongoClient(url);
    await client.connect();

    try {
        const results = await circulationRepo.loadData(data);
        assert.equal(data.length, results.insertedCount);

        const getData = await circulationRepo.get();
        assert.equal(data.length, getData.length); // compare the objects

        const filterData = await circulationRepo.get({ Newspaper: getData[4].Newspaper });
        assert.deepEqual(filterData[0], getData[4]);// deepEqual compare the objects contents

        const limitData = await circulationRepo.get({}, 3); // limit of 3 itens
        assert.equal(limitData.length, 3);

        const id = getData[4]._id.toString();
        const byId = await circulationRepo.getById(id); // get 4th icon
        assert.deepEqual(byId, getData[4]);

        const newItem = {
            "Newspaper": "My paper",
            "Daily Circulation, 2004": 1,
            "Daily Circulation, 2013": 2,
            "Change in Daily Circulation, 2004-2013": 100,
            "Pulitzer Prize Winners and Finalists, 1990-2003": 0,
            "Pulitzer Prize Winners and Finalists, 2004-2014": 0,
            "Pulitzer Prize Winners and Finalists, 1990-2014": 0
        }
        const addedItem = await circulationRepo.add(newItem); // add new item to database
        assert(addedItem._id); // if addedItem has an _id it means that it has been added
        const addedItemQuery = await circulationRepo.getById(addedItem._id);
        assert.deepEqual(addedItemQuery, newItem);

        const updatedItem = await circulationRepo.update(addedItem._id, {
            "Newspaper": "My new paper",
            "Daily Circulation, 2004": 1,
            "Daily Circulation, 2013": 2,
            "Change in Daily Circulation, 2004-2013": 100,
            "Pulitzer Prize Winners and Finalists, 1990-2003": 0,
            "Pulitzer Prize Winners and Finalists, 2004-2014": 0,
            "Pulitzer Prize Winners and Finalists, 1990-2014": 0
        })
        assert.deepEqual(updatedItem.Newspaper, "My new paper");
        const newAddedItemQuery = await circulationRepo.getById(addedItem._id);
        assert.deepEqual(newAddedItemQuery.Newspaper, "My new paper");

        const removed = await circulationRepo.remove(addedItem._id);
        assert(removed);
        const deletedItem = await circulationRepo.getById(addedItem._id);
        assert.equal(deletedItem, null);

        const avgFinalists = await circulationRepo.averageFinalists();
        console.log("Average Finalists: " + avgFinalists)

        const avgByChange = await circulationRepo.averageFinalists();
        console.log(avgByChange)

    } catch (error) {
        console.log(error);
    } finally {
        const admin = client.db(dbName).admin()

        await client.db(dbName).dropDatabase();
        console.log(await admin.listDatabases());

        client.close()
    }

}

main();