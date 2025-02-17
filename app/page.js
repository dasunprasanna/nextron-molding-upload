"use client";
import React, { useState, useEffect } from "react";
import Title from "./components/Title";
import Spinner from "./components/spinner";
import Image from "next/image";
import { ToastContainer, toast } from "react-toastify";

export default function DocumentUpload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [filelist, setFileList] = useState([]);
  const [formdata, setFormdata] = useState({
    date: "",
    createdby: "",
  });

  useEffect(() => {
    DocList();
  }, []);

  const convertDateTimeToDate = (dateTimeString) => {
    const date = new Date(dateTimeString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return dateTimeString !== null ? `${year}-${month}-${day}` : "";
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleChange = (e) => {
    setFormdata({ ...formdata, [e.target.name]: e.target.value });
  };

  const handleSubmitToast = (variable) => {

    // Show toast notification
    toast.success(`New ${variable} successfully uploaded!`, {
      position: "top-right",
      autoClose: 3000, // Close after 3 seconds
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

  const handleSubmitToastFailed = (variable) => {

    // Show toast notification
    toast.error(`New ${variable} uploading failed!`, {
      position: "top-right",
      autoClose: 3000, // Close after 3 seconds
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

  const handleDeleteToast = (variable) => {

    // Show toast notification
    toast.success(`${variable} successfully deleted!`, {
      position: "top-right",
      autoClose: 3000, // Close after 3 seconds
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) {
        alert("Please select a file to upload.");
        return;
    }

    setLoading(true);
    try {
        const formDataUpload = new FormData();
        formDataUpload.append("file", file);
        formDataUpload.append("date", formdata.date);

        const response = await fetch("/api/uploadExcel", {
            method: "POST",
            body: formDataUpload,
            cache: "no-store",
        });

        if (response.status === 409) {
            const data = await response.json();
            alert(`Molding plan already exists for the selected date. ${data.error}`);
        } else if (response.ok) {
            const data = await response.json();
            handleSubmitToast("Plan");
            setFile(null);
            setFormdata({ date: "" });
            e.target.reset();
            DocList();
        } else {
            const data = await response.json();
            handleSubmitToastFailed("Plan");
            e.target.reset();
        }
    } catch (error) {
        alert("An error occurred during file upload.");
        console.error(error);
        e.target.reset();
    } finally {
        setLoading(false);
    }
};

  const DocList = async () => {
    try {
      const response = await fetch("/api/files");
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }
      const jsonData = await response.json();
      setFileList(jsonData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleDeletePlan = async (date) => {

    setLoading(true);

    // Step 1: Validate the input
    if (!date) {
      alert("A valid Date must be provided to delete the plan.");
      return;
    }

    // Step 2: Get user confirmation
    const userConfirmed = window.confirm(
      `Are you sure you want to delete the plan of ${date} ?`
    );
    
    if (!userConfirmed){ 
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch("/api/deletePlan", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ date }),
      });

      const result = await response.json();

      if (response.ok) {
        handleDeleteToast(`${date} Plan`);
        DocList(); 
      } else {
        alert(result.message || "Failed to delete plan.");
      }
    } catch (error) {
      console.error("Error deleting plan:", error);
      alert("An error occurred while deleting the plan.");
    }
    finally {
      setLoading(false);
    }
  };

  //Paginated Table

  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filelist.slice(
    indexOfFirstRecord,
    indexOfLastRecord
  );

  const totalPages = Math.ceil(filelist.length / recordsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div>
      {loading && <Spinner />}
      <Title />
      <ToastContainer />
      <div className="documentadd">
        <form className="item-container-document" onSubmit={handleFileUpload}>
          <div>
            <label className="inputlable">Date</label>
            <input
              className="userinput-document"
              type="date"
              name="date"
              value={formdata.date}
              onChange={handleChange}
              required
            />
          </div>
          <label className="custom-file-label">
            Document
            <input
              className="custom-file"
              type="file"
              onChange={handleFileChange}
              accept=".xlsx, .xls"
            />
          </label>
          <div className="uploadbutton-container">
            <button className="uploadbutton" type="submit" disabled={uploading}>
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
          {message && <p>{message}</p>}
        </form>
      </div>
      <div className="table-container">
            <table className="table">
              <thead className="theader">
                <tr className="tabletr">
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className="tblbdy">
                {currentRecords.map((item, index) => (
                  <tr key={index}>
                    <td>{convertDateTimeToDate(item.Date)}</td>
                    <td>
                      {" "}
                      <Image
                        src="/delete.png"
                        title="Delete"
                        alt=""
                        width={25}
                        height={25}
                        unoptimized
                        onClick={() => handleDeletePlan(convertDateTimeToDate(item.Date))}
                        style={{
                          cursor: "pointer",
                          margin: "0px 10px",
                          transition: "transform 0.3s ease",
                        }}
                        onMouseEnter={(e) =>
                          (e.target.style.transform = "scale(1.1)")
                        }
                        onMouseLeave={(e) =>
                          (e.target.style.transform = "scale(1)")
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="pagination">
        {/* Previous page button */}
        <button
          className="previousbutton"
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>

        {/* Page numbers */}
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index}
            onClick={() => paginate(index + 1)}
            className={currentPage === index + 1 ? "active" : ""}
          >
            {index + 1}
          </button>
        ))}

        {/* Next page button */}
        <button
          className="previousbutton"
          onClick={() => paginate(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </ul>
    </div>
  );
}
