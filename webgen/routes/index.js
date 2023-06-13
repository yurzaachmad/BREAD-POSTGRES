var express = require("express");
var router = express.Router();
var moment = require("moment");

/* GET home page. */
module.exports = function (db) {
  router.get("/", (req, res) => {
    const url = req.url == "/" ? "/?page=1" : req.url;
    const page = req.query.page || 1;

    const limit = 3;
    const offset = (page - 1) * limit;

    const params = [];
    const sqlsearch = [];

    if (req.query.id && req.query.id1) {
      params.push(req.query.id);
      sqlsearch.push(`id = $${params.length}`);
    }
    if (req.query.string && req.query.string1) {
      params.push(req.query.string);
      sqlsearch.push(`string ilike '%' || $${params.length} || '%'`);
    }
    if (req.query.integer && req.query.integer1) {
      params.push(req.query.integer);
      sqlsearch.push(`integer = $${params.length}`);
    }
    if (req.query.float && req.query.float1) {
      params.push(req.query.float);
      sqlsearch.push(`float = $${params.length}`);
    }
    if (req.query.dateS && req.query.date1) {
      params.push(req.query.dateS);
      params.push(req.query.dateE);
      sqlsearch.push(
        `date between $${params.length - 1} and $${params.length}`
      );
    }
    if (req.query.boolean && req.query.boolean1) {
      params.push(req.query.boolean);
      sqlsearch.push(`boolean = $${params.length}`);
    }

    let sql = "select count(*) as count from bread";
    if (params.length > 0) {
      sql += ` where ${sqlsearch.join(" and ")}`;
    }
    console.log(sql);
    db.query(sql, params, (err, countData) => {
      if (err) {
        console.log(err);
      }
      console.log(countData.rows[0].count);
      const totalPages = Math.ceil(countData.rows[0].count / limit);

      let query = "select * from bread";
      if (params.length > 0) {
        query += ` where ${sqlsearch.join(" and ")}`;
      }
      const sortOrder = req.query.sortOrder || "asc"; // Ambil query parameter sortOrder
      const sortBy = req.query.sortBy || "id";

      let sort;
      if (sortOrder === "asc") {
        sort = "ASC"; // Urutan ascending
      } else {
        sort = "DESC"; // Urutan descending
      }
      params.push(limit, offset);
      query += ` order by ${sortBy} ${sort}`;
      query += ` limit $${params.length - 1} offset $${params.length}`;
      console.log(query);
      db.query(query, params, (err, data) => {
        if (err) {
          console.log(err);
        }
        res.render("list", {
          data: data.rows,
          pages: totalPages,
          page,
          offset,
          query: req.query,
          url,
          moment,
          sortOrder: sortOrder,
          sortBy: sortBy,
        });
      });
    });
  });

  router.get("/add", (req, res) => {
    res.render("form", { data: {}, moment });
  });

  router.post("/add", (req, res) => {
    db.query(
      "insert into bread(string, integer, float, date, boolean) values ($1, $2, $3, $4, $5)",
      [
        req.body.string,
        req.body.integer,
        req.body.float,
        req.body.date,
        req.body.boolean,
      ],
      (err, data) => {
        if (err) {
          console.log(err);
        }
        res.redirect("/");
      }
    );
  });

  router.get("/edit/:id", (req, res) => {
    const id = req.params.id;
    db.query("select * from bread where id = $1", [id], (err, item) => {
      if (err) {
        console.log(err);
      }
      console.log(item);
      res.render("form", { data: item.rows[0], moment });
    });
  });

  router.post("/edit/:id", (req, res) => {
    const id = req.params.id;
    db.query(
      "UPDATE bread SET string = $1, integer = $2, float = $3, date = $4, boolean = $5 where id = $6",
      [
        req.body.string,
        req.body.integer,
        req.body.float,
        req.body.date,
        req.body.boolean,
        id,
      ],
      function (err) {
        if (err) {
          console.error(err);
        } else {
          res.redirect("/");
        }
      }
    );
  });

  router.get("/delete/:id", (req, res) => {
    const id = req.params.id;
    db.query("delete from bread where id = $1", [id], (err) => {
      if (err) {
        console.log("hapus data Kontrak gagal");
      }
      res.redirect("/");
    });
  });

  return router;
};
