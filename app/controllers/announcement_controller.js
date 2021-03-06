// controller for announcements

import Announcement from '../models/announcement_model';

const client = require('twilio')('AC8c99b5a46595bddff7a994e986079da1', 'fdd9ceec592ea9aa42c35d79894f80bc');

// change _id to id
const cleanID = (input) => {
  return { id: input._id, text: input.text, date: input.date, hacker: input.hacker, recruiter: input.recruiter };
};

// clean multiple inputs
const cleanIDs = (inputs) => {
  return inputs.map(input => {
    return cleanID(input);
  });
};

// create a new announcement
export const createAnn = (req, res) => {
  if (req.user.role !== 'organizer') {
    return res.status(401).send('You are not authorized for this action');
  }
  const announcement = new Announcement();
  announcement.text = req.body.text;
  announcement.date = req.body.date;
  announcement.hacker = req.body.hacker;
  announcement.recruiter = req.body.recruiter;
  announcement.save()
  .then(result => {
    res.json({ message: 'Post created!' });
    const phoneList = req.body.phoneList;
    for (let i = 0; i < phoneList.length; i++) {
      const phonenum = phoneList[i];
      const mymessage = announcement.text;
      client.sendSms({
        to: phonenum,
        from: '5084337056',
        body: mymessage,
      }, (error, message) => {
        if (!error) {
          console.log('Success! The SID for this SMS message is:');
          console.log(message.sid);
          console.log('Message sent on:');
          console.log(message.dateCreated);
        } else {
          console.log(error);
          console.log('Oops! There was an error.');
        }
      });
    }
  })
  .catch(error => {
    res.json({ error });
  });
};

// get all announcements
export const getAnns = (req, res) => {
  if (req.user.role === 'hacker') {
    Announcement.find({ hacker: true }).sort({ createdAt: -1 })
    .then(results => {
      res.json(cleanIDs(results));
    })
    .catch(error => {
      res.json({ error });
    });
  } else if (req.user.role === 'recruiter') {
    Announcement.find({ recruiter: true }).sort({ createdAt: -1 })
    .then(results => {
      res.json(cleanIDs(results));
    })
    .catch(error => {
      res.json({ error });
    });
  } else {
    Announcement.find({}).sort({ createdAt: -1 })
    .then(results => {
      res.json(cleanIDs(results));
    })
    .catch(error => {
      res.json({ error });
    });
  }
};

// delete an announcement
export const deleteAnn = (req, res) => {
  Announcement.findById(req.params.id).remove()
  .then(result => {
    res.json({ message: 'delete success' });
  })
  .catch(error => {
    res.json({ error });
  });
};
