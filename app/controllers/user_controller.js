// controller for user

import jwt from 'jwt-simple';
import config from '../config';
import UserModel from '../models/user_model';

const client = require('twilio')('AC8c99b5a46595bddff7a994e986079da1', 'fdd9ceec592ea9aa42c35d79894f80bc');

// change _id to id
const cleanID = (input) => {
  return { id: input._id,
    role: input.role,
    company: input.company,
    fullname: input.fullname,
    email: input.email,
    image: input.image,
    facebook: input.facebook,
    linkedin: input.linkedin,
    website: input.website,
    phone: input.phone,
    about: input.about,
    skills: input.skills };
};

// clean multiple inputs
const cleanIDs = (inputs) => {
  return inputs.map(input => {
    return cleanID(input);
  });
};

// encodes a new token for a user object
function tokenForUser(user) {
  const timestamp = new Date().getTime();
  return jwt.encode({ sub: user.id, iat: timestamp }, config.secret);
}

// sign in user
export const signin = (req, res, next) => {
  res.send({ token: tokenForUser(req.user), user: req.user });
};

// sign up user
export const signup = (req, res, next) => {
  const email = req.body.email;
  const name = req.body.fullname;
  const password = req.body.password;
  const role = req.body.role;
  const company = req.body.company;
  const image = req.body.image;

  if (!email || !password) {
    return res.status(422).send('You must provide email and password');
  }

  UserModel.findOne({ email })
      .then((user) => {
        if (user) {
          return res.status(422).send('User already exists');
        } else {
          const User = new UserModel();
          User.fullname = name;
          User.email = email;
          User.password = password;
          User.role = role;
          User.company = company;
          User.image = image;
          User.save()
          .then(
            // return a token
            res.send({ token: tokenForUser(User), user: User })
          );
        }
      });
};

// get a specific user profile
export const getProfile = (req, res) => {
  UserModel.findById(req.params.id).then(result => {
    if (result !== null) {
      res.json({ user: cleanID(result) });
    } else {
      res.json({ message: 'Error in findOne' });
    } }).catch(error => {
      res.json({ message: 'Error in findOne' });
    });
};

// get all users
export const getUsers = (req, res) => {
  UserModel.find().sort({ fullname: 1 })
  .then(results => {
    res.json(cleanIDs(results));
  })
  .catch(error => {
    res.json({ error });
  });
};

// delete a user
export const deleteUser = (req, res) => {
  if (req.user.role !== 'organizer') {
    return res.status(401).send('You are not authorized for this action');
  }

  UserModel.findById(req.params.id).remove()
  .then(result => {
    res.json({ message: `User successfully deleted: id: ${req.params.id}` });
  })
  .catch(error => {
    res.json({ error });
  });
};

// update a user profile
export const updateUser = (req, res) => {
  if (req.user.id !== req.body.id) {
    return res.status(401).send('You are not authorized for this action');
  }

  UserModel.findById(req.body.id)
  .then(result => {
    const update = result;
    const oldPhone = result.phone;
    update.image = req.body.image;
    update.website = req.body.website;
    update.facebook = req.body.facebook;
    update.linkedin = req.body.linkedin;
    update.about = req.body.about;
    update.phone = req.body.phone;
    update.skills = req.body.skills;
    update.save();
    res.json(cleanID(update));
    if (oldPhone !== update.phone) {
      client.sendSms({
        to: update.phone,
        from: '5084337056',
        body: 'Hello this is HackHub! You will be notified of HackHub announcements by text! To stop receiving texts, reply STOP. To resubscribe, reply START.',
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
