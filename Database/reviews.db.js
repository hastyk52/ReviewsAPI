const pool = require('./connection');

const readReviews = async (productId, page, count, sort) => {
  // some sort of helper to verify the values are valid
  let orderBy = 'reviews.date DESC'; // default case here
  if (sort === 'relevent') {
    // orderBy = '';
  } else if (sort === 'helpful') {
    orderBy = 'reviews.helpfulness DESC';
  } else if (sort === 'newest') { // derfault case goes last with no if statement - remove newest?
  // might not need alltogether if I set default above
    // orderBy = '';
  }

  // const name = 'Get Product'; // can I name a query that cvhanges based on params or does it have to be an identical query?
  const text = `SELECT reviews.id, reviews.rating, reviews.date, reviews.summary, reviews.body, reviews.recommended, reviews.reviewer_name, reviews.response, reviews.helpfulness, (
    SELECT COALESCE(json_agg(reviewPhotos), '[]'::JSON)
    FROM (
      SELECT photos.id, photos.url
      FROM photos
      WHERE photos.review_id = reviews.id
    ) reviewPhotos
  ) AS photos
  FROM reviews
  WHERE reviews.product_id = $1 AND reviews.reported = 'f'
  ORDER BY ${orderBy}
  LIMIT $2 OFFSET $3`;

  const values = [productId, count, page * count];
  // page 0 is the first page, would need (page - 1) * count
  // for page 1 to be first page. consider later.

  try {
    console.log('---------------------------------------');
    console.log('1.) Attempting to connect to Pool');

    const beforePoolConnect = new Date();
    const client = await pool.connect();
    const afterPoolConnect = new Date();

    console.log('2.) Successfully connected to Pool, client checked out. TIME TO CONNECT: ', afterPoolConnect - beforePoolConnect, ' ms');
    try {
      console.log('3.) Attempting to query DB for reviews');

      const beforeQuery = new Date();
      const queryRes = await client.query(text, values);
      const afterQuery = new Date();

      console.log('4.) Successful query made for reviews. TIME TO QUERY: ', afterQuery - beforeQuery, ' ms');
      return queryRes.rows;
    } catch (err) {
      console.log('4.) Error queryind data: ', err);

      throw new Error('Error querying DB', { cause: err });
    } finally {
      console.log('5.) returning client to pool');

      client.release();
      console.log('6.) client returned to pool');
    }
  } catch (err) {
    if (err.message === 'Error querying DB') {
      throw err;
    }

    console.log('3.) Error connecting to pool: ', err);
    throw new Error('DB Pool Connection Error', { cause: err });
  }
};

const createReview = async () => {

};

const incrementHelpful = async () => {

};

const reportReview = async () => {}
;

module.exports = {
  read: readReviews,
  create: createReview,
  update: {
    incrementHelpful,
    reportReview,
  },
};

// SELECT *, ARRAY [ SELECT ARRAY [ photos.id, photos.url ] FROM photos WHERE reviews.id = photos.review_id ] FROM reviews WHERE reviews.product_id = 2;

// SELECT review_id, JSON_AGG(photoid, photos.url) FROM photos group by review_id;

// SELECT JSON_GG

// SELECT row_to_json(review) as wantedReviews from( select reviews.id, reviews.rating, reviews.date, reviews.summary, body, recommended, reviewer_name, response, helpfulness, (select json_agg(reviewPhotos) from ( select photos.id, photos.url from photos where review_id = reviews.id ) reviewPhotos ) as photos from reviews where product_id = 2) review;

// select reviews.id, reviews.rating, reviews.date, reviews.summary, body, recommended, reviewer_name, response, helpfulness, (select json_agg(reviewPhotos) from ( select photos.id, photos.url from photos where review_id = reviews.id ) reviewPhotos ) as photos from reviews where product_id = 2


// SELECT reviews.id, reviews.rating, reviews.date, reviews.summary, reviews.body, reviews.recommended, reviews.reviewer_name, reviews.response, reviews.helpfulness, ( SELECT COALESCE(json_agg(reviewPhotos), '[]'::JSON) FROM ( SELECT photos.id, photos.url FROM photos WHERE review_id = reviews.id ) reviewPhotos ) AS photos FROM reviews WHERE product_id = 12 AND reviews.reported = 'f' ORDER BY reviews.date DESC LIMIT 5 OFFSET 0