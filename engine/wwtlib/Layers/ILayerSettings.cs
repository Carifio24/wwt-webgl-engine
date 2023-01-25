using System;

namespace wwtlib
{
    // Unfortunately, ScriptSharp does not support derived interfaces
    // so rather than just extend ILayerSettings, we need to repeat
    // its content in each of the more specific interfaces

    // Also, using the ? nullable notation breaks for enums,
    // but Nullable<T> works fine, so we use that for enum fields
    public interface ILayerSettings
    {
        bool? Astronomical { get; set; }
        Color Color { get; set; }
        bool? Enabled { get; set; }
        Date EndTime { get; set; }
        double? FadeSpan { get; set; }
        Nullable<FadeType> FadeType { get; set; }
        string Name { get; set; }
        float? Opacity { get; set; }
        bool? Opened { get; set; }
        string ReferenceFrame { get; set; }
        Date StartTime { get; set; }
        int? Version { get; set; }
    }

    public interface IImageSetLayerSettings
    {
        bool? Astronomical { get; set; }
        Color Color { get; set; }
        bool? Enabled { get; set; }
        Date EndTime { get; set; }
        double? FadeSpan { get; set; }
        Nullable<FadeType> FadeType { get; set; }
        string Name { get; set; }
        float? Opacity { get; set; }
        bool? Opened { get; set; }
        string ReferenceFrame { get; set; }
        Date StartTime { get; set; }
        int? Version { get; set; }
        string ColorMapperName { get; set; }
        bool? OverrideDefaultLayer { get; set; }
    }

    public interface ISpreadSheetLayerSettings
    {
        bool? Astronomical { get; set; }
        Color Color { get; set; }
        bool? Enabled { get; set; }
        Date EndTime { get; set; }
        double? FadeSpan { get; set; }
        Nullable<FadeType> FadeType { get; set; }
        string Name { get; set; }
        float? Opacity { get; set; }
        bool? Opened { get; set; }
        string ReferenceFrame { get; set; }
        Date StartTime { get; set; }
        int? Version { get; set; }
        int? AltColumn { get; set; }
        Nullable<AltTypes> AltType { get; set; }
        Nullable<AltUnits> AltUnit { get; set; }
        int? BarChartBitmask { get; set; }
        Date BeginRange { get; set; }
        double? CartesianCustomScale { get; set; }
        Nullable<AltUnits> CartesianScale { get; set; }
        int? ColorMapColumn { get; set; }
        string ColorMapperName { get; set; }
        Nullable<CoordinatesTypes> CoordinatesType { get; set; }
        float? Decay { get; set; }
        bool? DynamicColor { get; set; }
        bool? DynamicData { get; set; }
        int? EndDateColumn { get; set; }
        Date EndRange { get; set; }
        int? GeometryColumn { get; set; }
        int? HyperlinkColumn { get; set; }
        string HyperlinkFormat { get; set; }
        int? LatColumn { get; set; }
        int? LngColumn { get; set; }
        int? MarkerColumn { get; set; }
        int? MarkerIndex { get; set; }
        Nullable<MarkerScales> MarkerScale { get; set; }
        int? NameColumn { get; set; }
        bool? NormalizeColorMap { get; set; }
        float? NormalizeColorMapMax { get; set; }
        float? NormalizeColorMapMin { get; set; }
        bool? NormalizeSize { get; set; }
        bool? NormalizeSizeClip { get; set; }
        float? NormalizeSizeMax { get; set; }
        float? NormalizeSizeMin { get; set; }
        Nullable<PlotTypes> PlotType { get; set; }
        Nullable<PointScaleTypes> PointScaleType { get; set; }
        Nullable<RAUnits> RaUnits { get; set; }
        float? ScaleFactor { get; set; }
        bool? ShowFarSide { get; set; }
        int? SizeColumn { get; set; }
        int? StartDateColumn { get; set; }
        bool? TimeSeries { get; set; }
        int? XAxisColumn { get; set; }
        bool? XAxisReverse { get; set; }
        int? YAxisColumn { get; set; }
        bool? YAxisReverse { get; set; }
        int? ZAxisColumn { get; set; }
        bool? ZAxisReverse { get; set; }
    }

    public interface IVoTableLayerSettings
    {
        bool? Astronomical { get; set; }
        Color Color { get; set; }
        bool? Enabled { get; set; }
        Date EndTime { get; set; }
        double? FadeSpan { get; set; }
        Nullable<FadeType> FadeType { get; set; }
        string Name { get; set; }
        float? Opacity { get; set; }
        bool? Opened { get; set; }
        string ReferenceFrame { get; set; }
        Date StartTime { get; set; }
        int? Version { get; set; }
        int? AltColumn { get; set; }
        Nullable<AltTypes> AltType { get; set; }
        Nullable<AltUnits> AltUnit { get; set; }
        bool? AutoUpdate { get; set; }
        Date BeginRange { get; set; }
        double? CartesianCustomScale { get; set; }
        Nullable<AltUnits> CartesianScale { get; set; }
        int? ColorMapColumn { get; set; }
        Nullable<CoordinatesTypes> CoordinatesType { get; set; }
        string DataSourceUrl { get; set; }
        float? Decay { get; set; }
        bool? DynamicData { get; set; }
        int? EndDateColumn { get; set; }
        Date EndRange { get; set; }
        int? GeometryColumn { get; set; }
        int? HyperlinkColumn { get; set; }
        string HyperlinkFormat { get; set; }
        int? LatColumn { get; set; }
        int? LngColumn { get; set; }
        int? MarkerColumn { get; set; }
        int? MarkerIndex { get; set; }
        Nullable<MarkerScales> MarkerScale { get; set; }
        int? NameColumn { get; set; }
        Nullable<PlotTypes> PlotType { get; set; }
        Nullable<PointScaleTypes> PointScaleType { get; set; }
        Nullable<RAUnits> RaUnits { get; set; }
        float? ScaleFactor { get; set; }
        bool? ShowFarSide { get; set; }
        int? SizeColumn { get; set; }
        int? StartDateColumn { get; set; }
        bool? TimeSeries { get; set; }
        int? XAxisColumn { get; set; }
        bool? XAxisReverse { get; set; }
        int? YAxisColumn { get; set; }
        bool? YAxisReverse { get; set; }
        int? ZAxisColumn { get; set; }
        bool? ZAxisReverse { get; set; }
    }
}
