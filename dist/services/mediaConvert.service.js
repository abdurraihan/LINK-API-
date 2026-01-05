import { MediaConvertClient, CreateJobCommand, GetJobCommand, AudioDefaultSelection, AudioCodec, AacCodingMode, VideoCodec, H264RateControlMode, H264QualityTuningLevel, H264FramerateControl, H264GopSizeUnits, H264InterlaceMode, H264ParControl, AacCodecProfile, AacRateControlMode, M3u8PcrControl, M3u8Scte35Source, TimedMetadata, HlsManifestDurationFormat, HlsStreamInfResolution, HlsSegmentControl, HlsDirectoryStructure, HlsManifestCompression, HlsClientCache, HlsCodecSpecification, HlsProgramDateTime, ContainerType, } from "@aws-sdk/client-mediaconvert";
import { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, MC_ENDPOINT, MC_ROLE_ARN, S3_UPLOAD_BUCKET, S3_OUTPUT_BUCKET, } from "../config/config.js";
const mediaConvertClient = new MediaConvertClient({
    region: AWS_REGION,
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
    endpoint: MC_ENDPOINT,
});
export const createTranscodeJob = async ({ inputKey, outputKeyPrefix, }) => {
    const input = `s3://${S3_UPLOAD_BUCKET}/${inputKey}`;
    const outputDestination = `s3://${S3_OUTPUT_BUCKET}/${outputKeyPrefix}/`;
    const jobSettings = {
        Role: MC_ROLE_ARN,
        Settings: {
            Inputs: [
                {
                    FileInput: input,
                    AudioSelectors: {
                        "Audio Selector 1": {
                            DefaultSelection: AudioDefaultSelection.DEFAULT,
                        },
                    },
                    VideoSelector: {},
                },
            ],
            OutputGroups: [
                {
                    Name: "Apple HLS",
                    OutputGroupSettings: {
                        Type: "HLS_GROUP_SETTINGS",
                        HlsGroupSettings: {
                            Destination: outputDestination + "index", // ✅ THIS IS THE KEY FIX
                            SegmentLength: 6,
                            MinSegmentLength: 0,
                            ManifestDurationFormat: HlsManifestDurationFormat.INTEGER,
                            StreamInfResolution: HlsStreamInfResolution.INCLUDE,
                            SegmentControl: HlsSegmentControl.SEGMENTED_FILES,
                            DirectoryStructure: HlsDirectoryStructure.SINGLE_DIRECTORY,
                            ManifestCompression: HlsManifestCompression.NONE,
                            ClientCache: HlsClientCache.ENABLED,
                            CodecSpecification: HlsCodecSpecification.RFC_4281,
                            ProgramDateTime: HlsProgramDateTime.EXCLUDE,
                        },
                    },
                    Outputs: [
                        // 1080p
                        {
                            NameModifier: "_1080p",
                            ContainerSettings: {
                                Container: ContainerType.M3U8,
                                M3u8Settings: {
                                    AudioFramesPerPes: 4,
                                    PcrControl: M3u8PcrControl.PCR_EVERY_PES_PACKET,
                                    PmtPid: 480,
                                    PrivateMetadataPid: 503,
                                    ProgramNumber: 1,
                                    PatInterval: 0,
                                    PmtInterval: 0,
                                    Scte35Source: M3u8Scte35Source.NONE,
                                    Scte35Pid: 500,
                                    TimedMetadata: TimedMetadata.NONE,
                                    TimedMetadataPid: 502,
                                    VideoPid: 481,
                                    AudioPids: [482, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492],
                                },
                            },
                            VideoDescription: {
                                Width: 1920,
                                Height: 1080,
                                CodecSettings: {
                                    Codec: VideoCodec.H_264,
                                    H264Settings: {
                                        RateControlMode: H264RateControlMode.QVBR,
                                        QualityTuningLevel: H264QualityTuningLevel.SINGLE_PASS_HQ,
                                        MaxBitrate: 5000000,
                                        FramerateControl: H264FramerateControl.INITIALIZE_FROM_SOURCE,
                                        GopSize: 90,
                                        GopSizeUnits: H264GopSizeUnits.FRAMES,
                                        InterlaceMode: H264InterlaceMode.PROGRESSIVE,
                                        ParControl: H264ParControl.INITIALIZE_FROM_SOURCE,
                                    },
                                },
                            },
                            AudioDescriptions: [
                                {
                                    CodecSettings: {
                                        Codec: AudioCodec.AAC,
                                        AacSettings: {
                                            Bitrate: 128000,
                                            CodingMode: AacCodingMode.CODING_MODE_2_0,
                                            SampleRate: 48000,
                                            CodecProfile: AacCodecProfile.LC,
                                            RateControlMode: AacRateControlMode.CBR,
                                        },
                                    },
                                },
                            ],
                        },
                        // 720p
                        {
                            NameModifier: "_720p",
                            ContainerSettings: {
                                Container: ContainerType.M3U8,
                                M3u8Settings: {
                                    AudioFramesPerPes: 4,
                                    PcrControl: M3u8PcrControl.PCR_EVERY_PES_PACKET,
                                    PmtPid: 480,
                                    PrivateMetadataPid: 503,
                                    ProgramNumber: 1,
                                    PatInterval: 0,
                                    PmtInterval: 0,
                                    Scte35Source: M3u8Scte35Source.NONE,
                                    Scte35Pid: 500,
                                    TimedMetadata: TimedMetadata.NONE,
                                    TimedMetadataPid: 502,
                                    VideoPid: 481,
                                    AudioPids: [482, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492],
                                },
                            },
                            VideoDescription: {
                                Width: 1280,
                                Height: 720,
                                CodecSettings: {
                                    Codec: VideoCodec.H_264,
                                    H264Settings: {
                                        RateControlMode: H264RateControlMode.QVBR,
                                        QualityTuningLevel: H264QualityTuningLevel.SINGLE_PASS_HQ,
                                        MaxBitrate: 3000000,
                                        FramerateControl: H264FramerateControl.INITIALIZE_FROM_SOURCE,
                                        GopSize: 90,
                                        GopSizeUnits: H264GopSizeUnits.FRAMES,
                                        InterlaceMode: H264InterlaceMode.PROGRESSIVE,
                                        ParControl: H264ParControl.INITIALIZE_FROM_SOURCE,
                                    },
                                },
                            },
                            AudioDescriptions: [
                                {
                                    CodecSettings: {
                                        Codec: AudioCodec.AAC,
                                        AacSettings: {
                                            Bitrate: 128000,
                                            CodingMode: AacCodingMode.CODING_MODE_2_0,
                                            SampleRate: 48000,
                                            CodecProfile: AacCodecProfile.LC,
                                            RateControlMode: AacRateControlMode.CBR,
                                        },
                                    },
                                },
                            ],
                        },
                        // 480p
                        {
                            NameModifier: "_480p",
                            ContainerSettings: {
                                Container: ContainerType.M3U8,
                                M3u8Settings: {
                                    AudioFramesPerPes: 4,
                                    PcrControl: M3u8PcrControl.PCR_EVERY_PES_PACKET,
                                    PmtPid: 480,
                                    PrivateMetadataPid: 503,
                                    ProgramNumber: 1,
                                    PatInterval: 0,
                                    PmtInterval: 0,
                                    Scte35Source: M3u8Scte35Source.NONE,
                                    Scte35Pid: 500,
                                    TimedMetadata: TimedMetadata.NONE,
                                    TimedMetadataPid: 502,
                                    VideoPid: 481,
                                    AudioPids: [482, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492],
                                },
                            },
                            VideoDescription: {
                                Width: 854,
                                Height: 480,
                                CodecSettings: {
                                    Codec: VideoCodec.H_264,
                                    H264Settings: {
                                        RateControlMode: H264RateControlMode.QVBR,
                                        QualityTuningLevel: H264QualityTuningLevel.SINGLE_PASS_HQ,
                                        MaxBitrate: 1500000,
                                        FramerateControl: H264FramerateControl.INITIALIZE_FROM_SOURCE,
                                        GopSize: 90,
                                        GopSizeUnits: H264GopSizeUnits.FRAMES,
                                        InterlaceMode: H264InterlaceMode.PROGRESSIVE,
                                        ParControl: H264ParControl.INITIALIZE_FROM_SOURCE,
                                    },
                                },
                            },
                            AudioDescriptions: [
                                {
                                    CodecSettings: {
                                        Codec: AudioCodec.AAC,
                                        AacSettings: {
                                            Bitrate: 128000,
                                            CodingMode: AacCodingMode.CODING_MODE_2_0,
                                            SampleRate: 48000,
                                            CodecProfile: AacCodecProfile.LC,
                                            RateControlMode: AacRateControlMode.CBR,
                                        },
                                    },
                                },
                            ],
                        },
                        // 360p
                        {
                            NameModifier: "_360p",
                            ContainerSettings: {
                                Container: ContainerType.M3U8,
                                M3u8Settings: {
                                    AudioFramesPerPes: 4,
                                    PcrControl: M3u8PcrControl.PCR_EVERY_PES_PACKET,
                                    PmtPid: 480,
                                    PrivateMetadataPid: 503,
                                    ProgramNumber: 1,
                                    PatInterval: 0,
                                    PmtInterval: 0,
                                    Scte35Source: M3u8Scte35Source.NONE,
                                    Scte35Pid: 500,
                                    TimedMetadata: TimedMetadata.NONE,
                                    TimedMetadataPid: 502,
                                    VideoPid: 481,
                                    AudioPids: [482, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492],
                                },
                            },
                            VideoDescription: {
                                Width: 640,
                                Height: 360,
                                CodecSettings: {
                                    Codec: VideoCodec.H_264,
                                    H264Settings: {
                                        RateControlMode: H264RateControlMode.QVBR,
                                        QualityTuningLevel: H264QualityTuningLevel.SINGLE_PASS_HQ,
                                        MaxBitrate: 800000,
                                        FramerateControl: H264FramerateControl.INITIALIZE_FROM_SOURCE,
                                        GopSize: 90,
                                        GopSizeUnits: H264GopSizeUnits.FRAMES,
                                        InterlaceMode: H264InterlaceMode.PROGRESSIVE,
                                        ParControl: H264ParControl.INITIALIZE_FROM_SOURCE,
                                    },
                                },
                            },
                            AudioDescriptions: [
                                {
                                    CodecSettings: {
                                        Codec: AudioCodec.AAC,
                                        AacSettings: {
                                            Bitrate: 96000,
                                            CodingMode: AacCodingMode.CODING_MODE_2_0,
                                            SampleRate: 48000,
                                            CodecProfile: AacCodecProfile.LC,
                                            RateControlMode: AacRateControlMode.CBR,
                                        },
                                    },
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    };
    try {
        const command = new CreateJobCommand(jobSettings);
        const response = await mediaConvertClient.send(command);
        console.log("MediaConvert job created:", {
            jobId: response.Job?.Id,
            status: response.Job?.Status,
        });
        return {
            jobId: response.Job?.Id,
            status: response.Job?.Status,
        };
    }
    catch (error) {
        console.error("MediaConvert job creation failed:", error);
        throw error;
    }
};
export const getJobStatus = async (jobId) => {
    try {
        const command = new GetJobCommand({ Id: jobId });
        const response = await mediaConvertClient.send(command);
        return {
            status: response.Job?.Status,
            progress: response.Job?.JobPercentComplete,
        };
    }
    catch (error) {
        console.error("Get job status failed:", error);
        throw error;
    }
};
