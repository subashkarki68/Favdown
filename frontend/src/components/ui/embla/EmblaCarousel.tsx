import {
  ArrowDownCircleIcon,
  ArrowLeftCircleIcon,
  ArrowRightCircleIcon,
  PauseCircleIcon,
  PlayCircleIcon,
} from "@heroicons/react/24/outline";
import { EmblaOptionsType } from "embla-carousel";
import ClassNames from "embla-carousel-class-names";
import useEmblaCarousel from "embla-carousel-react";
import React, { useState } from "react";
import { usePrevNextButtons } from "./EmblaCarouselArrowButtons";
// import { DotButton, useDotButton } from "./EmblaCarouselDotButton";
import { DownloadByName } from "@/services/youtubeServices";
import { SpotifyTrack } from "@/types/SpotifyTrack";
import "../../../../app/embla.css";

type PropType = {
  data: any;
  options?: EmblaOptionsType;
};

const EmblaCarousel: React.FC<PropType> = (props) => {
  const { data, options } = props;
  const [emblaRef, emblaApi] = useEmblaCarousel(options, [ClassNames()]);
  const [isGrabbing, setIsGrabbing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleGrabbing = () => {
    setIsGrabbing(true);
  };

  const handleGrabRelease = () => {
    setIsGrabbing(false);
  };

  const handleDownload = async (artistTitle: string, songTitle: string) => {
    setIsDownloading(true);
    const success = await DownloadByName(artistTitle, songTitle);
    if (success) {
      setIsDownloading(false);
    }
  };

  const mediaControlClasses =
    "h-12 w-12 text-white cursor-pointer hover:text-primary hover:bg-white rounded-full";
  // const { selectedIndex, scrollSnaps, onDotButtonClick } =
  //   useDotButton(emblaApi);

  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick,
  } = usePrevNextButtons(emblaApi);

  return (
    <div className="embla theme-light">
      <div className="embla__viewport" ref={emblaRef}>
        <div
          className={`embla__container ${
            isGrabbing ? "cursor-grabbing" : "cursor-grab"
          }`}
          onMouseDown={handleGrabbing}
          onMouseUp={handleGrabRelease}
          onMouseLeave={handleGrabRelease}
        >
          {data.map((track: SpotifyTrack) => (
            <div
              className="embla__slide embla__class-names relative"
              key={track.track.id}
            >
              <img
                className="embla__slide__img"
                src={`${track.track.album.images[0].url}`}
                alt={track.track.name}
              />
              <div className="absolute bottom-0 bg-black blur-lg opacity-40 w-full h-[28%]"></div>
              <div className="absolute bottom-0 w-full h-[28%] overflow-hidden">
                <div className="flex flex-col justify-center items-center mt-6 md:flex md:flex-row md:justify-evenly w-full">
                  <div className="z-10">
                    <h2 className="text-3xl font-mono text-white text-wrap">
                      {track.track.name}
                    </h2>
                    <div className="text-xl italic text-white ">
                      {track.track.artists.map((artist, index) => {
                        const artistsCount = track.track.artists.length;
                        const isLastArtist = index === artistsCount - 1;
                        const isSecLastArtist = index === artistsCount - 2;
                        return (
                          <span key={artist.id}>
                            <a href="#" className="hover:underline">
                              {artist.name}
                            </a>
                            {artistsCount > 1 &&
                            !isLastArtist &&
                            !isSecLastArtist
                              ? ", "
                              : ""}
                            {artistsCount > 1 && isSecLastArtist ? " & " : ""}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div className="media_buttons flex md:gap-3">
                    <ArrowLeftCircleIcon
                      className={mediaControlClasses}
                      onClick={onPrevButtonClick}
                    />

                    {isPlaying ? (
                      <PauseCircleIcon className={mediaControlClasses} />
                    ) : (
                      <PlayCircleIcon className={mediaControlClasses} />
                    )}

                    <ArrowRightCircleIcon
                      className={mediaControlClasses}
                      onClick={onNextButtonClick}
                    />
                    <ArrowDownCircleIcon
                      className={`${mediaControlClasses} ${
                        isDownloading ? "animate-bounce" : ""
                      }`}
                      onClick={() =>
                        handleDownload(
                          track.track.artists[0].name,
                          track.track.name
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* <div className="embla__controls">
        <div className="embla__buttons">
          <PrevButton onClick={onPrevButtonClick} disabled={prevBtnDisabled} />
          <NextButton onClick={onNextButtonClick} disabled={nextBtnDisabled} />
        </div>

        <div className="embla__dots">
          {scrollSnaps.map((_, index) => (
            <DotButton
              key={index}
              onClick={() => onDotButtonClick(index)}
              className={"embla__dot".concat(
                index === selectedIndex ? " embla__dot--selected" : ""
              )}
            />
          ))}
        </div>
      </div> */}
    </div>
  );
};

export default EmblaCarousel;
