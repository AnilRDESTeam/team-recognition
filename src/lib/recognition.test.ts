import { describe, expect, it } from "vitest";
import { CURRENT_USER_ID, STORAGE_KEY, loadRecognitions, newestFirst, restoreRecognitions, saveRecognitions, seedRecognitions, validateRecognition } from "./recognition";

const valid = { recipientId: "maya", badgeId: "team-player", message: "Thank you!" };

describe("recognition validation", () => {
  it("accepts a valid recognition", () => expect(validateRecognition(valid)).toEqual({}));
  it("rejects blank and overlength messages", () => {
    expect(validateRecognition({ ...valid, message: " \n " }).message).toBeTruthy();
    expect(validateRecognition({ ...valid, message: "a".repeat(501) }).message).toBeTruthy();
    expect(validateRecognition({ ...valid, message: "a".repeat(500) })).toEqual({});
  });
  it("rejects missing, unknown and self recipients", () => {
    for (const recipientId of ["", "unknown", CURRENT_USER_ID]) expect(validateRecognition({ ...valid, recipientId }).recipientId).toBeTruthy();
  });
  it("rejects missing and unknown badges", () => {
    for (const badgeId of ["", "unknown"]) expect(validateRecognition({ ...valid, badgeId }).badgeId).toBeTruthy();
  });
});

describe("browser persistence", () => {
  it("seeds first use and round-trips valid records", () => {
    const records = seedRecognitions();
    expect(restoreRecognitions(null)).toHaveLength(4);
    expect(restoreRecognitions(JSON.stringify(records))).toEqual(records);
  });
  it("keeps an intentionally empty feed", () => expect(restoreRecognitions("[]")).toEqual([]));
  it("sorts newest first without mutating the input", () => {
    const records = seedRecognitions().reverse();
    const firstId = records[0].id;
    expect(newestFirst(records)[0].id).toBe("seed-1");
    expect(records[0].id).toBe(firstId);
  });
  it("falls back for malformed data and invalid records", () => {
    for (const value of ["bad json", "{}", "[null]", JSON.stringify([{ ...seedRecognitions()[0], createdAt: "bad" }]), JSON.stringify([{ ...seedRecognitions()[0], senderId: "unknown" }]), JSON.stringify([{ ...seedRecognitions()[0], message: 4 }])]) {
      expect(restoreRecognitions(value)).toHaveLength(4);
    }
  });
  it("rejects duplicate record ids", () => {
    const record = seedRecognitions()[0];
    expect(restoreRecognitions(JSON.stringify([record, record]))).toHaveLength(4);
  });
  it("writes using the versioned key", () => {
    const records = seedRecognitions();
    let stored = "";
    expect(saveRecognitions({ setItem: (key, value) => { expect(key).toBe(STORAGE_KEY); stored = value; } }, records)).toBe(true);
    expect(loadRecognitions({ getItem: () => stored }).records).toEqual(records);
  });
  it("degrades safely when reads or writes are denied", () => {
    expect(loadRecognitions({ getItem: () => { throw new Error("denied"); } }).available).toBe(false);
    expect(saveRecognitions({ setItem: () => { throw new Error("quota"); } }, [])).toBe(false);
  });
});