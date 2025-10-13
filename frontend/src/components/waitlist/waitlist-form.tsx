"use client";

import * as React from "react";
import { useState } from "react";
import { TextField, Button, Flex } from "@radix-ui/themes";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

export function WaitlistForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("waitlist")
        .insert([
          {
            email: email.toLowerCase().trim(),
            name: null,
            created_at: new Date().toISOString(),
          },
        ]);

      if (error) {
        if (error.code === "23505") {
          toast.error("This email is already on the waitlist!");
        } else {
          throw error;
        }
      } else {
        setEmail("");
        toast.success("You're on the list! We'll be in touch soon.");
      }
    } catch (error) {
      console.error("Error submitting to waitlist:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto flex justify-center">
      <Flex gap="3" align="center">
        <TextField.Root
          size="3"
          placeholder="Enter your email"
          color="lime"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
          required
          style={{
            backgroundColor: 'white',
            width: '350px',
          }}
        />
        <Button
          type="submit"
          size="3"
          variant="classic"
          color="lime"
          disabled={isSubmitting}
          className="whitespace-nowrap"
        >
          {isSubmitting ? "Joining..." : "Join Waitlist"}
        </Button>
      </Flex>
    </form>
  );
}
