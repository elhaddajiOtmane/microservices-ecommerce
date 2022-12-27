import express, { Request, Response } from "express";
import { param } from "express-validator";
import jwt from "jsonwebtoken";
import {
  validateRequest,
  NotFoundError,
  BadRequestError,
} from "@thasup-dev/common";

import { User } from "../models/user";
import { Password } from "../services/Password";
import { UserAttrs } from "../types/user";

const router = express.Router();

router.patch(
  "/api/users/:userId",
  [param("userId").isMongoId().withMessage("Invalid MongoDB ObjectId")],
  validateRequest,
  async (req: Request, res: Response) => {
    const {
      email,
      password,
      newPassword,
      isAdmin,
      name,
      image,
      gender,
      age,
      bio,
      shippingAddress: jsonShippingAddress,
    }: {newPassword: string} & UserAttrs = req.body;

    const user = await User.findById(req.params.userId);

    if (!user) {
      throw new NotFoundError();
    }

    if (password) {
      const existingUser = await User.findOne({ name });

      if (!existingUser) {
        throw new BadRequestError("Invalid credentials");
      }

      const isMatch = await Password.compare(
        existingUser.password,
        password
      );

      if (!isMatch) {
        throw new BadRequestError("Invalid credentials");
      }
    }

		// Check if it a JSON or not
    let shippingAddress;
    if (typeof jsonShippingAddress === "string") {
			console.log('string', jsonShippingAddress);
      shippingAddress = await JSON.parse(jsonShippingAddress);
    } else if (typeof jsonShippingAddress === "object") {
			console.log('obj', jsonShippingAddress);
      shippingAddress = jsonShippingAddress;
    }

    user.set({
      email: email ?? user.email,
      password: newPassword ?? password ?? user.password,
      isAdmin: isAdmin ?? user.isAdmin,
      name: name ?? user.name,
      image: image ?? user.image,
      gender: gender ?? user.gender,
      age: age ?? user.age,
      bio: bio ?? user.bio,
      shippingAddress: shippingAddress ?? user.shippingAddress,
    });

    await user.save();

    // Generate JWT
    const userJWT = jwt.sign(
      {
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
        name: user.name,
        image: user.image,
        gender: user.gender,
        age: user.age,
        bio: user.bio,
        shippingAddress: user.shippingAddress,
      },
      process.env.JWT_KEY!
    );

    // Store it on session object
    req.session = {
      jwt: userJWT,
    };

    res.send(user);
  }
);

export { router as updateUserRouter };
