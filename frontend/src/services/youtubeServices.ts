import React, { useState } from "react";
import useSWR from "swr";
import axios from "axios";

export const DownloadByName = async (
  artistTitle: string,
  songTitle: string
) => {
  try {
    const HOST_URL = import.meta.env.VITE_HOST;
    console.log("🚀 ~ DownloadByName ~ songName:", artistTitle, songTitle);
    const fetcher = (url: string) => axios.get(url).then((res) => res.data);
    const response = await axios(
      `${HOST_URL}/api/v1/youtube/download?t=${artistTitle} - ${songTitle}`,
      { responseType: "blob" }
    );
    if (!response.data) {
      throw new Error("Failed to download file");
    }
    // Create a blob URL for the file
    const url = window.URL.createObjectURL(new Blob([response.data]));

    // Create a temporary link element
    const link = document.createElement("a");
    link.href = url;

    // Set the download attribute and filename
    link.setAttribute("download", `${artistTitle} - ${songTitle}.mp3`);

    // Append the link to the document body
    document.body.appendChild(link);

    // Trigger the click event to start the download
    link.click();

    // Cleanup: remove the link and revoke the object URL
    link && link?.parentNode && link?.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
    //   if (!isLoading) console.log(data);
    //   if (error) console.error("Error Occured during download", error);
    return { success: true };
  } catch (error) {
    console.error("Error downloading file:", error);
  }
};
