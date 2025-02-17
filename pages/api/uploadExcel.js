import { IncomingForm } from "formidable";
import fs from "fs";
import path from "path";
import xlsx from "xlsx";
import { connectToDatabase } from "../../db1";
import sql from "mssql";

export const config = {
    api: {
        bodyParser: false,
    },
};

const excelSerialToDate = (serial) => {
    const epoch = new Date(1900, 0, serial - 1);
    return epoch.toISOString().split("T")[0];
};

const excelSerialToTime = (serial) => {
    const totalSeconds = Math.round(serial * 24 * 3600);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const parseExcelFile = (filePath) => {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    return data.map((row) => ({
        ...row,
        Input: typeof row.Input === "number" ? excelSerialToDate(row.Input) : row.Input,
        AchTime: typeof row.AchTime === "number" ? excelSerialToTime(row.AchTime) : row.AchTime,
        NewMoldStart: typeof row.NewMoldStart === "number" ? excelSerialToTime(row.NewMoldStart) : row.NewMoldStart,
        NewMoldEnd: typeof row.NewMoldEnd === "number" ? excelSerialToTime(row.NewMoldEnd) : row.NewMoldEnd,
        Style: String(row.Style || "N/A").trim(),
        SewOrder: String(row.SewOrder || "N/A").trim(),
        Color: String(row.Color || "N/A").trim(),
        Cup: String(row.Cup || "N/A").trim(),
        Kegal1: String(row.Kegal1 || "N/A").trim(),
    }));
};

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const form = new IncomingForm({
        keepExtensions: true,
        uploadDir: path.join(process.cwd(), "/public/uploads"),
        multiples: false,
    });

    form.parse(req, async (err, fields, files) => {
        if (err) {
            return res.status(500).json({ error: "File upload error" });
        }

        const file = files.file ? files.file[0] : null;
        const date = fields.date ? fields.date[0] : null;

        if (!file?.filepath || !date) {
            return res.status(400).json({ error: "Missing file or date value" });
        }

        const filePath = file.filepath;
        let pool;

        try {
            pool = await connectToDatabase();

            const checkDate = await pool.request()
                .input("Date", sql.Date, date)
                .query("SELECT COUNT(*) as count FROM MoldingPlan WHERE Date = @Date");

            if (checkDate.recordset[0].count > 0) {
                fs.unlink(filePath, () => {});
                return res.status(409).json({ error: "Data already exists for the selected date." });
            }

            const data = parseExcelFile(filePath);
            const insertPromises = data.map((item) => {
                return pool.request()
                    .input("Date", sql.Date, date)
                    .input("MachineNo", sql.VarChar, item.MachineNo)
                    .input("HandingTime", sql.Float, item.HandingTime)
                    .input("CycleTime", sql.Float, item.CycleTime)
                    .input("Kegal", sql.VarChar, item.Kegal)
                    .input("Layer", sql.Int, item.Layer)
                    .input("WC", sql.VarChar, item.WC)
                    .input("Input", sql.Date, item.Input)
                    .input("Color", sql.VarChar, item.Color)
                    .input("Style", sql.VarChar, item.Style)
                    .input("SewOrder", sql.VarChar, item.SewOrder)
                    .input("Cup", sql.VarChar, item.Cup)
                    .input("Size", sql.VarChar, item.Size)
                    .input("Kegal1", sql.VarChar, item.Kegal1)
                    .input("PlanQty", sql.Int, item.PlanQty)
                    .input("ActQty", sql.Int, item.ActQty)
                    .input("MoldTimeMin", sql.Int, item.MoldTimeMin)
                    .input("MoldTimeMin2", sql.Int, item.MoldTimeMin2)
                    .input("TotalHours", sql.Float, item.TotalHours)
                    .input("AchTime", sql.VarChar, item.AchTime)
                    .input("NewMoldStart", sql.VarChar, item.NewMoldStart)
                    .input("NewMoldEnd", sql.VarChar, item.NewMoldEnd)
                    .query(`
                        INSERT INTO MoldingPlan (Date, MachineNo, HandingTime, CycleTime, Kegal, Layer, WC, Input, Color,
                        Style, SewOrder, Cup, Size, Kegal1, PlanQty, ActQty, MoldTimeMin, MoldTimeMin2, TotalHours, AchTime, 
                        NewMoldStart, NewMoldEnd)
                        VALUES (@Date, @MachineNo, @HandingTime, @CycleTime, @Kegal, @Layer, @WC, @Input, @Color,
                        @Style, @SewOrder, @Cup, @Size, @Kegal1, @PlanQty, @ActQty, @MoldTimeMin, @MoldTimeMin2, @TotalHours, 
                        @AchTime, @NewMoldStart, @NewMoldEnd)
                    `);
            });

            await Promise.all(insertPromises);
            res.status(200).json({ message: "Data uploaded successfully." });

        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Database insertion failed." });

        } finally {
            fs.unlink(filePath, () => {});
            if (pool) pool.close();
        }
    });
}
